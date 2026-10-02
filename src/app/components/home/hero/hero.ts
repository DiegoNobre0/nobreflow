import { Component, inject } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';
import { OperationDiagnosisService } from '../../../core/services/operation-diagnosis';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss']
})
export class HeroComponent {
  private readonly diagnosis = inject(OperationDiagnosisService);

  openDiagnosis(): void {
    this.diagnosis.open('Hero');
  }
}
