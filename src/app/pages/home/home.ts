import { Component } from '@angular/core';
import {NavbarComponent } from '../../components/navbar/navbar';
import { HeroComponent } from '../../components/hero/hero';
import { FeaturesComponent } from '../../components/features/features';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works';
import { TestimonialsComponent } from '../../components/testimonials/testimonials';
import { PricingComponent } from '../../components/princing/princing';
import {  CtaComponent } from '../../components/cta/cta';
import { Footer } from '../../components/footer/footer';



@Component({
  selector: 'app-home',
  standalone: true,
 
  imports: [
   NavbarComponent,
    HeroComponent,
    HowItWorksComponent,
    FeaturesComponent,
    TestimonialsComponent,
    PricingComponent,
    CtaComponent,
    Footer
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'] // se houver
})
export class Home { 
  // Lógica do componente home
}