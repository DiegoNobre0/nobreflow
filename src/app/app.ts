import { Component, HostListener, inject } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent';
import { TrackingConsentService } from './core/services/tracking-consent';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
  
    RouterOutlet,
    CookieConsentComponent
],
  templateUrl: './app.html'
})
export class AppComponent {
  private readonly trackingConsent = inject(TrackingConsentService);

  constructor() {
    this.trackingConsent.initialize();
  }

  @HostListener('document:click', ['$event'])
  trackWhatsAppClick(event: MouseEvent): void {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="wa.me"]');
    if (link) {
      this.trackingConsent.trackWhatsAppContact(link.dataset['pixelSource'] ?? 'WhatsApp');
    }
  }
}
