import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OperationDiagnosisService } from '../../../core/services/operation-diagnosis';
import { TrackingConsentService } from '../../../core/services/tracking-consent';

type AnswerKey = 'bottleneck' | 'currentMethod' | 'goal';

interface DiagnosisOption {
  value: string;
  label: string;
}

interface DiagnosisQuestion {
  key: AnswerKey;
  title: string;
  hint: string;
  options: DiagnosisOption[];
}

@Component({
  selector: 'app-operation-diagnosis',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './operation-diagnosis.html',
  styleUrls: ['./operation-diagnosis.scss'],
})
export class OperationDiagnosisComponent {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  readonly diagnosis = inject(OperationDiagnosisService);
  private readonly document = inject(DOCUMENT);
  private readonly tracking = inject(TrackingConsentService);
  private readonly formBuilder = inject(FormBuilder);

  readonly questions: DiagnosisQuestion[] = [
    {
      key: 'bottleneck',
      title: 'Onde sua empresa mais perde tempo hoje?',
      hint: 'Escolha o ponto que mais atrasa sua operação.',
      options: [
        { value: 'atendimento', label: 'Atendimento' },
        { value: 'vendas', label: 'Vendas' },
        { value: 'agenda', label: 'Agenda' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'estoque', label: 'Estoque' },
        { value: 'processos-internos', label: 'Processos internos' },
      ],
    },
    {
      key: 'currentMethod',
      title: 'Como esse processo é feito atualmente?',
      hint: 'Isso nos ajuda a entender o nível de retrabalho.',
      options: [
        { value: 'manualmente', label: 'Manualmente' },
        { value: 'planilhas', label: 'Planilhas' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'sistema-pronto', label: 'Sistema pronto' },
        { value: 'varios-sistemas', label: 'Vários sistemas' },
      ],
    },
    {
      key: 'goal',
      title: 'O que você gostaria de melhorar primeiro?',
      hint: 'Selecione o resultado mais importante agora.',
      options: [
        { value: 'economizar-tempo', label: 'Economizar tempo' },
        { value: 'reduzir-erros', label: 'Reduzir erros' },
        { value: 'organizar-atendimento', label: 'Organizar atendimento' },
        { value: 'centralizar-informacoes', label: 'Centralizar informações' },
        { value: 'automatizar-tarefas', label: 'Automatizar tarefas' },
      ],
    },
  ];

  readonly form = this.formBuilder.nonNullable.group({
    bottleneck: '',
    currentMethod: '',
    goal: '',
  });

  step = 0;

  constructor() {
    effect((onCleanup) => {
      if (!this.diagnosis.isOpen()) {
        return;
      }

      this.reset();
      const previousOverflow = this.document.body.style.overflow;
      const previousFocus = this.document.activeElement as HTMLElement | null;
      this.document.body.style.overflow = 'hidden';
      this.tracking.trackQualification('QualificationStarted', this.diagnosis.source());
      const focusTimer = setTimeout(() => this.dialog?.nativeElement.focus());

      onCleanup(() => {
        clearTimeout(focusTimer);
        this.document.body.style.overflow = previousOverflow;
        previousFocus?.focus();
      });
    });
  }

  get currentQuestion(): DiagnosisQuestion {
    return this.questions[this.step];
  }

  selectAnswer(question: DiagnosisQuestion, value: string): void {
    this.form.controls[question.key].setValue(value);

    if (this.step < this.questions.length - 1) {
      this.step += 1;
      return;
    }

    this.step = this.questions.length;
    this.tracking.trackQualification('QualificationCompleted', this.diagnosis.source());
  }

  back(): void {
    if (this.step > 0) {
      this.step -= 1;
    }
  }

  close(): void {
    this.diagnosis.close();
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  whatsappUrl(): string {
    const answers = this.form.getRawValue();
    const message = [
      'Olá! Gostaria de analisar minha operação com a NobreFlow.',
      '',
      `Principal gargalo: ${this.answerLabel('bottleneck', answers.bottleneck)}`,
      `Controle atual: ${this.answerLabel('currentMethod', answers.currentMethod)}`,
      `Objetivo: ${this.answerLabel('goal', answers.goal)}`,
    ].join('\n');

    return `https://wa.me/5571981482521?text=${encodeURIComponent(message)}`;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.diagnosis.isOpen()) {
      this.close();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  keepFocusInside(event: Event): void {
    if (!this.diagnosis.isOpen() || !this.dialog) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const focusableElements = Array.from(
      this.dialog.nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (keyboardEvent.shiftKey && (this.document.activeElement === firstElement || this.document.activeElement === this.dialog.nativeElement)) {
      keyboardEvent.preventDefault();
      lastElement.focus();
    } else if (!keyboardEvent.shiftKey && this.document.activeElement === lastElement) {
      keyboardEvent.preventDefault();
      firstElement.focus();
    }
  }

  private answerLabel(key: AnswerKey, value: string): string {
    const question = this.questions.find((item) => item.key === key);
    return question?.options.find((option) => option.value === value)?.label ?? value;
  }

  private reset(): void {
    this.step = 0;
    this.form.reset();
  }
}
