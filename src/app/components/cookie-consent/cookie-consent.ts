import { Component, inject } from '@angular/core';
import { TrackingConsentService } from '../../core/services/tracking-consent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.scss',
})
export class CookieConsentComponent {
  protected readonly trackingConsent = inject(TrackingConsentService);
}
