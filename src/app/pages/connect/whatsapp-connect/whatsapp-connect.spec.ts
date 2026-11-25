import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NEVER, of } from 'rxjs';
import {
  ConnectorOnboardingConfig,
  ConnectorOnboardingService,
} from '../../../core/services/connector-onboarding.service';
import {
  FacebookLoginResponse,
  FacebookSdkService,
} from '../../../core/services/facebook-sdk.service';
import { WhatsAppConnectComponent } from './whatsapp-connect';

describe('WhatsAppConnectComponent', () => {
  let fixture: ComponentFixture<WhatsAppConnectComponent>;
  let component: WhatsAppConnectComponent;
  let loginCallback: ((response: FacebookLoginResponse) => void) | undefined;

  const config: ConnectorOnboardingConfig = {
    sessionId: 'session-1',
    installationName: 'Atendimento principal',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    state: 'state-value',
    sdk: {
      appId: 'app-1',
      configId: 'config-1',
      graphApiVersion: 'v24.0',
      featureType: 'whatsapp_business_app_onboarding',
    },
  };

  const connectorApi = {
    getConfig: vi.fn(() => of(config)),
    complete: vi.fn(() => NEVER),
  };
  const facebookSdk = {
    loadAndInitialize: vi.fn(() => Promise.resolve()),
    login: vi.fn((_config, callback: (response: FacebookLoginResponse) => void) => {
      loginCallback = callback;
    }),
  };

  beforeEach(async () => {
    connectorApi.getConfig.mockClear();
    connectorApi.complete.mockClear();
    facebookSdk.loadAndInitialize.mockClear();
    facebookSdk.login.mockClear();
    loginCallback = undefined;

    await TestBed.configureTestingModule({
      imports: [WhatsAppConnectComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ sessionId: 'session-1' }), fragment: 'token=launch-token' } },
        },
        { provide: ConnectorOnboardingService, useValue: connectorApi },
        { provide: FacebookSdkService, useValue: facebookSdk },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsAppConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('combines the embedded signup event with the authorization code', () => {
    expect(component.pageState()).toBe('ready');
    component.connect();

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.facebook.com',
      data: JSON.stringify({
        type: 'WA_EMBEDDED_SIGNUP',
        event: 'FINISH',
        data: { business_id: 'business-1', waba_id: 'waba-1', phone_number_id: 'phone-1' },
      }),
    }));
    loginCallback?.({ authResponse: { code: 'authorization-code' } });

    expect(connectorApi.complete).toHaveBeenCalledWith('session-1', 'launch-token', {
      state: 'state-value',
      code: 'authorization-code',
      event: { businessId: 'business-1', wabaId: 'waba-1', phoneNumberId: 'phone-1' },
    });
    expect(component.pageState()).toBe('completing');
  });
});
