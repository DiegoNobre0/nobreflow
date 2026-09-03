import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';


@Component({
  selector: 'app-features',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './features.html',
  styleUrls: ['./features.scss']
})
export class FeaturesComponent {}