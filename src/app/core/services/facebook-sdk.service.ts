import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { ConnectorSdkConfig } from './connector-onboarding.service';

export interface FacebookLoginResponse {
  authResponse?: {
    code?: string;
  };
  status?: string;
}

interface FacebookLoginOptions {
  config_id: string;
  response_type: 'code';
  override_default_response_type: true;
  extras: {
    setup: Record<string, never>;
    featureType: string;
  };
}

interface FacebookSdk {
  init(options: { appId: string; version: string; cookie: boolean; xfbml: boolean }): void;
  login(callback: (response: FacebookLoginResponse) => void, options: FacebookLoginOptions): void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
  }
}

@Injectable({ providedIn: 'root' })
export class FacebookSdkService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private loadPromise?: Promise<FacebookSdk>;
  private initialized = false;

  async loadAndInitialize(config: ConnectorSdkConfig): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Facebook SDK is only available in the browser.');
    }

    const sdk = await this.load();
    sdk.init({
      appId: config.appId,
      version: config.graphApiVersion,
      cookie: true,
      xfbml: false,
    });
    this.initialized = true;
  }

  login(config: ConnectorSdkConfig, callback: (response: FacebookLoginResponse) => void): void {
    const sdk = this.browserWindow?.FB;
    if (!sdk || !this.initialized) {
      throw new Error('Facebook SDK is not ready.');
    }

    sdk.login(callback, {
      config_id: config.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: config.featureType,
      },
    });
  }

  private load(): Promise<FacebookSdk> {
    const existingSdk = this.browserWindow?.FB;
    if (existingSdk) {
      return Promise.resolve(existingSdk);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<FacebookSdk>((resolve, reject) => {
      const existingScript = this.document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
      const script = existingScript ?? this.document.createElement('script');

      const loaded = (): void => {
        const sdk = this.browserWindow?.FB;
        if (sdk) {
          resolve(sdk);
        } else {
          this.loadPromise = undefined;
          script.remove();
          reject(new Error('Facebook SDK did not initialize.'));
        }
      };
      const failed = (): void => {
        this.loadPromise = undefined;
        script.remove();
        reject(new Error('Facebook SDK could not be loaded.'));
      };

      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', failed, { once: true });

      if (!existingScript) {
        script.id = 'facebook-jssdk';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
        this.document.head.appendChild(script);
      }
    });

    return this.loadPromise;
  }

  private get browserWindow(): Window | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return this.document.defaultView;
  }
}
