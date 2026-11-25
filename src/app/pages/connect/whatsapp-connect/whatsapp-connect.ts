import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Subscription, timeout } from 'rxjs';
import {
  ConnectorEventIds,
  ConnectorOnboardingConfig,
  ConnectorOnboardingService,
} from '../../../core/services/connector-onboarding.service';
import {
  FacebookLoginResponse,
  FacebookSdkService,
} from '../../../core/services/facebook-sdk.service';

type ConnectorPageState =
  | 'loading'
  | 'ready'
  | 'connecting'
  | 'completing'
  | 'success'
  | 'error'
  | 'terminal-error'
  | 'expired'
  | 'cancelled';

interface EmbeddedSignupPayload {
  type: 'WA_EMBEDDED_SIGNUP';
  event: string;
  data?: Record<string, unknown>;
}

const FACEBOOK_MESSAGE_ORIGINS = new Set([
  'https://www.facebook.com',
  'https://web.facebook.com',
]);
const AUTH_EVENT_GRACE_MS = 2500;

@Component({
  selector: 'app-whatsapp-connect',
  standalone: true,
  templateUrl: './whatsapp-connect.html',
  styleUrl: './whatsapp-connect.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppConnectComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly connectorApi = inject(ConnectorOnboardingService);
  private readonly facebookSdk = inject(FacebookSdkService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly meta = inject(Meta);

  readonly pageState = signal<ConnectorPageState>('loading');
  readonly config = signal<ConnectorOnboardingConfig | null>(null);
  readonly errorTitle = signal('Não foi possível continuar');
  readonly errorMessage = signal('Tente novamente em alguns instantes.');
  readonly installationName = computed(() => this.config()?.installationName ?? 'sua instalação');
  readonly expirationLabel = computed(() => this.formatExpiration(this.config()?.expiresAt));

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  private readonly launchToken = this.readLaunchToken(this.route.snapshot.fragment);
  private configRequest?: Subscription;
  private completeRequest?: Subscription;
  private messageListener?: (event: MessageEvent<unknown>) => void;
  private expirationTimer?: ReturnType<typeof setTimeout>;
  private graceTimer?: ReturnType<typeof setTimeout>;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private configLoadId = 0;
  private sdkReady = false;
  private activeAttempt = false;
  private loginReturned = false;
  private authorizationCode?: string;
  private eventIds?: ConnectorEventIds;
  private destroyed = false;
  private previousRobotsContent = 'index, follow, max-image-preview:large';

  ngOnInit(): void {
    this.previousRobotsContent = this.meta.getTag('name="robots"')?.content ?? this.previousRobotsContent;
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow, noarchive' });
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.messageListener = (event) => this.zone.run(() => this.handleMessage(event));
    window.addEventListener('message', this.messageListener);
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.meta.updateTag({ name: 'robots', content: this.previousRobotsContent });
    this.destroyed = true;
    this.activeAttempt = false;
    this.clearSensitiveAttemptData();
    this.configRequest?.unsubscribe();
    this.completeRequest?.unsubscribe();
    this.clearTimers();
    if (this.messageListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  loadConfig(): void {
    if (!isPlatformBrowser(this.platformId) || !this.sessionId || !this.launchToken) {
      this.showExpired();
      return;
    }

    const loadId = ++this.configLoadId;
    this.configRequest?.unsubscribe();
    this.clearExpirationTimer();
    this.sdkReady = false;
    this.config.set(null);
    this.pageState.set('loading');

    this.configRequest = this.connectorApi.getConfig(this.sessionId, this.launchToken).subscribe({
      next: (config) => {
        if (loadId !== this.configLoadId || this.destroyed) return;
        if (this.isExpired(config.expiresAt)) {
          this.showExpired();
          return;
        }

        this.config.set(config);
        this.scheduleExpiration(config.expiresAt);
        void this.facebookSdk.loadAndInitialize(config.sdk).then(() => {
          if (loadId !== this.configLoadId || this.destroyed || this.isExpired(config.expiresAt)) return;
          this.sdkReady = true;
          this.pageState.set('ready');
        }).catch(() => {
          if (loadId !== this.configLoadId || this.destroyed) return;
          this.showError(
            'Não foi possível carregar o Facebook',
            'Verifique sua conexão e tente carregar esta página novamente.',
          );
        });
      },
      error: (error: HttpErrorResponse) => {
        if (loadId !== this.configLoadId || this.destroyed) return;
        if (error.status === 404 || error.status === 410) {
          this.showExpired();
          return;
        }
        this.showError(
          'Não foi possível validar este acesso',
          'O serviço está temporariamente indisponível. Tente novamente.',
        );
      },
    });
  }

  connect(): void {
    const config = this.config();
    if (!config || !this.sdkReady || this.isExpired(config.expiresAt)) {
      if (config && this.isExpired(config.expiresAt)) this.showExpired();
      return;
    }

    this.resetAttempt();
    this.activeAttempt = true;
    this.pageState.set('connecting');

    // Keep this call synchronous with the user gesture so browsers allow the popup.
    try {
      this.facebookSdk.login(config.sdk, (response) => {
        this.zone.run(() => this.handleLoginResponse(response));
      });
    } catch {
      this.failAttempt(
        'Não foi possível abrir o Facebook',
        'Tente novamente. Se o problema continuar, habilite pop-ups para esta página.',
      );
    }
  }

  retryConnection(): void {
    const config = this.config();
    if (!config || !this.sdkReady) {
      this.loadConfig();
      return;
    }
    if (this.isExpired(config.expiresAt)) {
      this.showExpired();
      return;
    }
    this.pageState.set('ready');
  }

  private handleLoginResponse(response: FacebookLoginResponse): void {
    if (!this.activeAttempt || this.pageState() !== 'connecting') return;

    this.loginReturned = true;
    const code = response.authResponse?.code;
    if (typeof code === 'string' && code.length > 0) {
      this.authorizationCode = code;
    }
    this.resolveAttempt();
  }

  private handleMessage(message: MessageEvent<unknown>): void {
    if (!this.activeAttempt || !FACEBOOK_MESSAGE_ORIGINS.has(message.origin)) return;

    const payload = this.parseEmbeddedSignupPayload(message.data);
    if (!payload) return;

    if (payload.event === 'FINISH' || payload.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
      const eventIds = this.extractEventIds(payload.data);
      if (!eventIds) {
        this.failAttempt(
          'A conexão ficou incompleta',
          'O Facebook não informou a conta e o telefone selecionados. Inicie a conexão novamente.',
        );
        return;
      }
      this.eventIds = eventIds;
      this.resolveAttempt();
      return;
    }

    if (payload.event === 'CANCEL' || payload.event === 'CANCEL_WHATSAPP_BUSINESS_APP_ONBOARDING') {
      this.cancelAttempt();
      return;
    }

    if (payload.event === 'ERROR' || payload.event === 'ERROR_WHATSAPP_BUSINESS_APP_ONBOARDING') {
      this.failAttempt(
        'O Facebook não concluiu a conexão',
        'Nenhuma alteração foi salva. Revise os requisitos e tente novamente.',
      );
    }
  }

  private resolveAttempt(): void {
    if (this.authorizationCode && this.eventIds) {
      this.completeOnboarding();
      return;
    }

    if (!this.graceTimer) {
      this.graceTimer = setTimeout(() => {
        this.graceTimer = undefined;
        if (!this.activeAttempt || this.pageState() !== 'connecting') return;

        if (this.loginReturned && !this.authorizationCode) {
          this.cancelAttempt();
        } else {
          this.failAttempt(
            'A conexão ficou incompleta',
            'Não recebemos todas as confirmações do Facebook. Inicie a conexão novamente.',
          );
        }
      }, AUTH_EVENT_GRACE_MS);
    }
  }

  private completeOnboarding(): void {
    const config = this.config();
    const code = this.authorizationCode;
    const event = this.eventIds;
    if (!config || !code || !event) return;

    this.activeAttempt = false;
    this.clearGraceTimer();
    this.pageState.set('completing');

    const request = { state: config.state, code, event };
    this.clearSensitiveAttemptData();
    this.completeRequest = this.connectorApi.complete(this.sessionId, this.launchToken, request)
      .pipe(timeout({ first: 20_000 }))
      .subscribe({
      next: (response) => {
        if (this.destroyed) return;
        if (response.status !== 'COMPLETED' || typeof response.redirectUrl !== 'string' || !response.redirectUrl) {
          this.showTerminalError(
            'A confirmação não pôde ser validada',
            'Reinicie a conexão para gerar uma nova autorização.',
          );
          return;
        }

        this.clearExpirationTimer();
        this.pageState.set('success');
        this.redirectTimer = setTimeout(() => window.location.assign(response.redirectUrl), 1200);
      },
      error: (error: HttpErrorResponse) => {
        if (this.destroyed) return;
        if (error.status === 404 || error.status === 410) {
          this.showExpired();
          return;
        }
        this.showTerminalError(
          'Não foi possível confirmar a conexão',
          'A autorização não foi salva. Inicie a conexão novamente com segurança.',
        );
      },
      });
  }

  private parseEmbeddedSignupPayload(data: unknown): EmbeddedSignupPayload | null {
    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data) as unknown;
      } catch {
        return null;
      }
    }

    if (!this.isRecord(parsed) || parsed['type'] !== 'WA_EMBEDDED_SIGNUP' || typeof parsed['event'] !== 'string') {
      return null;
    }

    return {
      type: 'WA_EMBEDDED_SIGNUP',
      event: parsed['event'],
      data: this.isRecord(parsed['data']) ? parsed['data'] : undefined,
    };
  }

  private extractEventIds(data?: Record<string, unknown>): ConnectorEventIds | null {
    if (!data) return null;
    const wabaId = this.readString(data, 'waba_id', 'wabaId');
    const phoneNumberId = this.readString(data, 'phone_number_id', 'phoneNumberId');
    if (!wabaId || !phoneNumberId) return null;
    return { businessId: this.readString(data, 'business_id', 'businessId'), wabaId, phoneNumberId };
  }

  private readString(data: Record<string, unknown>, snakeCaseKey: string, camelCaseKey: string): string | undefined {
    const value = data[snakeCaseKey] ?? data[camelCaseKey];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private cancelAttempt(): void {
    this.activeAttempt = false;
    this.clearGraceTimer();
    this.clearSensitiveAttemptData();
    this.pageState.set('cancelled');
  }

  private failAttempt(title: string, message: string): void {
    this.activeAttempt = false;
    this.clearGraceTimer();
    this.clearSensitiveAttemptData();
    this.showError(title, message);
  }

  private showError(title: string, message: string): void {
    this.errorTitle.set(title);
    this.errorMessage.set(message);
    this.pageState.set('error');
  }

  private showTerminalError(title: string, message: string): void {
    this.errorTitle.set(title);
    this.errorMessage.set(message);
    this.pageState.set('terminal-error');
  }

  private readLaunchToken(fragment: string | null): string {
    if (!fragment) return '';
    return new URLSearchParams(fragment).get('token') ?? '';
  }

  private showExpired(): void {
    this.activeAttempt = false;
    this.clearGraceTimer();
    this.clearSensitiveAttemptData();
    this.pageState.set('expired');
  }

  private resetAttempt(): void {
    this.clearGraceTimer();
    this.clearSensitiveAttemptData();
    this.loginReturned = false;
  }

  private clearSensitiveAttemptData(): void {
    this.authorizationCode = undefined;
    this.eventIds = undefined;
  }

  private scheduleExpiration(expiresAt: string): void {
    const delay = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) {
      this.showExpired();
      return;
    }
    this.expirationTimer = setTimeout(() => {
      if (this.pageState() !== 'success' && this.pageState() !== 'completing') this.showExpired();
    }, Math.min(delay, 2_147_483_647));
  }

  private isExpired(expiresAt: string): boolean {
    const expiration = Date.parse(expiresAt);
    return !Number.isFinite(expiration) || expiration <= Date.now();
  }

  private formatExpiration(expiresAt?: string): string {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  private clearGraceTimer(): void {
    if (this.graceTimer) clearTimeout(this.graceTimer);
    this.graceTimer = undefined;
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    this.expirationTimer = undefined;
  }

  private clearTimers(): void {
    this.clearGraceTimer();
    this.clearExpirationTimer();
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    this.redirectTimer = undefined;
  }
}
