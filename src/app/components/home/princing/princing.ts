import { Component, inject } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';
import { OperationDiagnosisService } from '../../../core/services/operation-diagnosis';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './princing.html',
  styleUrls: ['./princing.scss']
})
export class PricingComponent {
  private readonly diagnosis = inject(OperationDiagnosisService);

  openDiagnosis(): void {
    this.diagnosis.open('Planos');
  }
}
