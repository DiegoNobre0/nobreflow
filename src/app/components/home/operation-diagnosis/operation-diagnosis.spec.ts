import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationDiagnosisService } from '../../../core/services/operation-diagnosis';
import { OperationDiagnosisComponent } from './operation-diagnosis';

describe('OperationDiagnosisComponent', () => {
  let component: OperationDiagnosisComponent;
  let fixture: ComponentFixture<OperationDiagnosisComponent>;
  let diagnosis: OperationDiagnosisService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationDiagnosisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationDiagnosisComponent);
    component = fixture.componentInstance;
    diagnosis = TestBed.inject(OperationDiagnosisService);
    fixture.detectChanges();
  });

  it('completes the three-question flow', () => {
    diagnosis.open('Hero');
    fixture.detectChanges();

    component.selectAnswer(component.questions[0], 'agenda');
    component.selectAnswer(component.questions[1], 'whatsapp');
    component.selectAnswer(component.questions[2], 'economizar-tempo');

    expect(component.step).toBe(3);
    expect(component.form.getRawValue()).toEqual({
      bottleneck: 'agenda',
      currentMethod: 'whatsapp',
      goal: 'economizar-tempo',
    });
  });

  it('builds a contextualized WhatsApp message', () => {
    diagnosis.open('CTA final');
    fixture.detectChanges();
    component.form.setValue({
      bottleneck: 'atendimento',
      currentMethod: 'planilhas',
      goal: 'automatizar-tarefas',
    });

    const url = decodeURIComponent(component.whatsappUrl());

    expect(url).toContain('Principal gargalo: Atendimento');
    expect(url).toContain('Controle atual: Planilhas');
    expect(url).toContain('Objetivo: Automatizar tarefas');
    expect(url).not.toContain('Origem:');
  });
});
