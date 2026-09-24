import { Component, inject } from '@angular/core';
import { TrackingConsentService } from '../../../core/services/tracking-consent';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly trackingConsent = inject(TrackingConsentService);
}
