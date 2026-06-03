import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal';


@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './how-it-works.html',
  styleUrls: ['./how-it-works.scss']
})
export class HowItWorksComponent {}