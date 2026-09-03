import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './princing.html',
  styleUrls: ['./princing.scss']
})
export class PricingComponent {}