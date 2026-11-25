import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConnectorOnboardingService } from './connector-onboarding.service';

describe('ConnectorOnboardingService', () => {
  let service: ConnectorOnboardingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectorOnboardingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConnectorOnboardingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a public session using an encoded session id', () => {
    service.getConfig('session/one', 'launch-token').subscribe();

    const request = http.expectOne('/api/connector/public/onboarding/sessions/session%2Fone/config');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-Nobreflow-Launch-Token')).toBe('launch-token');
    request.flush({});
  });

  it('sends the completion contract unchanged', () => {
    const body = {
      state: 'state-value',
      code: 'authorization-code',
      event: { businessId: 'business-1', wabaId: 'waba-1', phoneNumberId: 'phone-1' },
    };

    service.complete('session-1', 'launch-token', body).subscribe();

    const request = http.expectOne('/api/connector/public/onboarding/sessions/session-1/complete');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Nobreflow-Launch-Token')).toBe('launch-token');
    expect(request.request.body).toEqual(body);
    request.flush({ status: 'COMPLETED', redirectUrl: 'https://example.com/complete' });
  });
});
