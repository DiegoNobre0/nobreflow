import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroComponent } from './components/hero/hero';
import { HowItWorksComponent } from './components/how-it-works/how-it-works';
import { FeaturesComponent } from './components/features/features';
import { TestimonialsComponent } from './components/testimonials/testimonials';
import { PricingComponent } from './components/princing/princing';
import { CtaComponent } from './components/cta/cta';
import { Footer } from "./components/footer/footer";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
  
    RouterOutlet
],
  templateUrl: './app.html'
})
export class AppComponent {}