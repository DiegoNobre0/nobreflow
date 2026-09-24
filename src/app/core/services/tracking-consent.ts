import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type TrackingConsent = 'accepted' | 'rejected' | 'pending';

type MetaPixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: MetaPixel;
  queue: unknown[][];
  version?: string;
};

type MetaWindow = Window & {
  fbq?: MetaPixel;
  _fbq?: MetaPixel;
};

@Injectable({ providedIn: 'root' })
export class TrackingConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'nobreflow-tracking-consent';
  private readonly pixelId = '4084163915174045';
  private initialized = false;

  readonly consent = signal<TrackingConsent>('pending');
  readonly policyOpen = signal(false);

  initialize(): void {
    const preference = this.readPreference();
    this.consent.set(preference);

    if (preference === 'accepted') {
      this.loadPixel();
    }
  }

  accept(): void {
    const previousPreference = this.consent();
    this.savePreference('accepted');
    this.consent.set('accepted');
    this.policyOpen.set(false);

    if (this.initialized) {
      this.metaWindow?.fbq?.('consent', 'grant');
      if (previousPreference === 'rejected') {
        this.metaWindow?.fbq?.('track', 'PageView');
      }
      return;
    }

    this.loadPixel();
  }

  reject(): void {
    this.savePreference('rejected');
    this.consent.set('rejected');
    this.policyOpen.set(false);
    this.metaWindow?.fbq?.('consent', 'revoke');
  }

  openPolicy(): void {
    this.policyOpen.set(true);
  }

  closePolicy(): void {
    this.policyOpen.set(false);
  }

  trackWhatsAppContact(source: string): void {
    if (this.consent() !== 'accepted') {
      return;
    }

    this.loadPixel();
    this.metaWindow?.fbq?.('track', 'Contact', { content_name: source });
  }

  private loadPixel(): void {
    const window = this.metaWindow;
    if (!window || this.initialized) {
      return;
    }

    if (!window.fbq) {
      const fbq = function (...args: unknown[]): void {
        if (fbq.callMethod) {
          fbq.callMethod(...args);
        } else {
          fbq.queue.push(args);
        }
      } as MetaPixel;

      fbq.queue = [];
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      window.fbq = fbq;
      window._fbq = fbq;

      const script = this.document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      this.document.head.appendChild(script);
    }

    this.initialized = true;
    window.fbq?.('init', this.pixelId);
    window.fbq?.('track', 'PageView');
  }

  private readPreference(): TrackingConsent {
    try {
      const value = this.metaWindow?.localStorage.getItem(this.storageKey);
      return value === 'accepted' || value === 'rejected' ? value : 'pending';
    } catch {
      return 'pending';
    }
  }

  private savePreference(preference: Exclude<TrackingConsent, 'pending'>): void {
    try {
      this.metaWindow?.localStorage.setItem(this.storageKey, preference);
    } catch {
      // The current choice still applies to this page when storage is unavailable.
    }
  }

  private get metaWindow(): MetaWindow | null {
    return this.document.defaultView as MetaWindow | null;
  }
}
