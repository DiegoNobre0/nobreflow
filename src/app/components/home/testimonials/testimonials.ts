import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './testimonials.html',
  styleUrls: ['./testimonials.scss']
})
export class TestimonialsComponent {}