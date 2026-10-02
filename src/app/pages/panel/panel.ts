import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BillingService, CustomerAccess, Payment, Tenant } from '../../core/services/billing.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
})
export class PanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billing = inject(BillingService);
  readonly auth = inject(AuthService);

  readonly user = signal(this.auth.user());
  readonly tenants = signal<Tenant[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly paymentLink = signal<string | null>(null);
  readonly customerAccess = signal<CustomerAccess | null>(null);
  readonly isChangingPassword = signal(false);
  readonly totalPending = computed(() => this.payments()
    .filter((payment) => ['PENDING', 'OVERDUE'].includes(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount), 0));
  readonly totalReceived = computed(() => this.payments()
    .filter((payment) => ['CONFIRMED', 'RECEIVED'].includes(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount), 0));
  readonly overdueCount = computed(() => this.payments()
    .filter((payment) => payment.status === 'OVERDUE').length);

  readonly customerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    emailContato: ['', [Validators.required, Validators.email]],
    cpfCnpj: [''],
    whatsappNumber: ['', [Validators.required, Validators.minLength(12)]],
    domain: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    projectDescription: ['', Validators.required],
    rentalFee: ['R$ 200,00', Validators.required],
  });
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      tenants: this.billing.listTenants(),
      payments: this.billing.listPayments(),
    }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: ({ tenants, payments }) => {
        this.tenants.set(tenants.tenants);
        this.payments.set(payments.payments);
      },
      error: (error) => this.errorMessage.set(
        error.error?.message ?? 'Não foi possível carregar os dados do painel.',
      ),
    });
  }

  createCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const value = this.customerForm.getRawValue();
    const cpfCnpj = value.cpfCnpj.replace(/\D/g, '');
    const rentalFee = this.parseCurrency(value.rentalFee);
    if (rentalFee < 1) {
      this.errorMessage.set('Informe uma mensalidade válida.');
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.paymentLink.set(null);
    this.customerAccess.set(null);

    this.billing.createCustomer({
      ...value,
      rentalFee,
      cpfCnpj: cpfCnpj || undefined,
      whatsappNumber: value.whatsappNumber.replace(/\D/g, ''),
    }).pipe(
      finalize(() => this.isSubmitting.set(false)),
    ).subscribe({
      next: (response) => {
        this.successMessage.set('Cliente cadastrado e assinatura criada no Asaas.');
        this.paymentLink.set(response.asaasPaymentLink);
        this.customerAccess.set(response.customerAccess);
        this.customerForm.reset({ rentalFee: 'R$ 200,00' });
        this.loadDashboard();
      },
      error: (error) => this.errorMessage.set(
        error.error?.message ?? 'Não foi possível cadastrar o cliente.',
      ),
    });
  }

  formatCurrency(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const amount = Number(digits || '0') / 100;
    const formatted = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    this.customerForm.controls.rentalFee.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  private parseCurrency(value: string): number {
    const normalized = value
      .replace(/[^\d,]/g, '')
      .replace(',', '.');
    return Number(normalized) || 0;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.isChangingPassword.set(true);
    this.errorMessage.set(null);
    this.auth.changePassword(currentPassword, newPassword).pipe(
      finalize(() => this.isChangingPassword.set(false)),
    ).subscribe({
      next: ({ message, user }) => {
        this.user.set(user);
        this.passwordForm.reset();
        this.successMessage.set(message);
      },
      error: (error) => this.errorMessage.set(
        error.error?.message ?? 'Não foi possível alterar a senha.',
      ),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING_PAYMENT: 'Aguardando pagamento',
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      RECEIVED: 'Recebido',
      ACTIVE: 'Ativo',
      OVERDUE: 'Vencido',
      SUSPENDED: 'Suspenso',
      CANCELED: 'Cancelado',
      DELETED: 'Excluído',
      REFUNDED: 'Estornado',
    };
    return labels[status] ?? status;
  }
}
