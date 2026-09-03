import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/home/navbar/navbar';
import { HeroComponent } from '../../components/home/hero/hero';
import { PricingComponent } from '../../components/home/princing/princing';
import { TestimonialsComponent } from '../../components/home/testimonials/testimonials';
import { FeaturesComponent } from '../../components/home/features/features';
import { HowItWorksComponent } from '../../components/home/how-it-works/how-it-works';
import { CtaComponent } from '../../components/home/cta/cta';
import { Footer } from '../../components/home/footer/footer';




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