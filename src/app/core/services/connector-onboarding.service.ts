import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';

export interface ConnectorSdkConfig {
  appId: string;
  configId: string;
  graphApiVersion: string;
  featureType: string;
}

export interface ConnectorOnboardingConfig {
  sessionId: string;
  installationName: string;
  expiresAt: string;
  state: string;
  sdk: ConnectorSdkConfig;
}

export interface ConnectorEventIds {
  businessId?: string;
  wabaId: string;
  phoneNumberId: string;
}

export interface CompleteConnectorOnboardingRequest {
  state: string;
  code: string;
  event: ConnectorEventIds;
}

export interface CompleteConnectorOnboardingResponse {
  status: 'COMPLETED';
  redirectUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectorOnboardingService {
  // Public onboarding must not trigger the application's auth refresh flow.
  private readonly http: HttpClient;

  constructor(backend: HttpBackend) {
    this.http = new HttpClient(backend);
  }

  getConfig(sessionId: string, launchToken: string) {
    return this.http.get<ConnectorOnboardingConfig>(`${this.sessionUrl(sessionId)}/config`, {
      headers: { 'X-Nobreflow-Launch-Token': launchToken },
    });
  }

  complete(sessionId: string, launchToken: string, request: CompleteConnectorOnboardingRequest) {
    return this.http.post<CompleteConnectorOnboardingResponse>(
      `${this.sessionUrl(sessionId)}/complete`,
      request,
      { headers: { 'X-Nobreflow-Launch-Token': launchToken } },
    );
  }

  private sessionUrl(sessionId: string): string {
    return `${API_URL}/connector/public/onboarding/sessions/${encodeURIComponent(sessionId)}`;
  }
}
