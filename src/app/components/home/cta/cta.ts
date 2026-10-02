import { Component, inject } from '@angular/core';
import { ScrollRevealDirective } from '../../../directives/scroll-reveal';
import { OperationDiagnosisService } from '../../../core/services/operation-diagnosis';


@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './cta.html',
  styleUrls: ['./cta.scss']
})
export class CtaComponent {
  private readonly diagnosis = inject(OperationDiagnosisService);

  openDiagnosis(): void {
    this.diagnosis.open('CTA final');
  }
}
