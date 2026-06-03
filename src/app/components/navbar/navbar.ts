import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isScrolled = false;
  isMenuOpen = false;
  activeSection = 'home'; // Guarda qual seção está visível

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 40;
      this.checkActiveSection();
    }
  }

  // Função para fazer o scroll suave corrigindo a altura do menu fixo
  scrollTo(sectionId: string, event: Event) {
    event.preventDefault();
    this.isMenuOpen = false;
    
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = -80; // Altura aproximada do navbar
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }

  // Função que detecta qual seção está na tela (ScrollSpy)
  checkActiveSection() {
    const sections = ['home', 'how-it-works', 'features', 'testimonials', 'pricing'];
    let current = 'home';

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Se a seção passou do topo da tela (com um desconto de 150px)
        if (rect.top <= 150) {
          current = section;
        }
      }
    }
    this.activeSection = current;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}