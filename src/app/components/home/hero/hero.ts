import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class HeroComponent {}