import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal';


@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './cta.html',
  styleUrls: ['./cta.scss']
})
export class CtaComponent {}