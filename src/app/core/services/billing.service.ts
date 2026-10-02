import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../config/api.config';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
  dueDate: string | null;
  projectDescription: string;
}

export interface Payment {
  id: string;
  status: string;
  amount: string;
  billingType: string | null;
  dueDate: string;
  invoiceUrl: string | null;
  paidAt: string | null;
  tenant: {
    id: string;
    name: string;
    whatsappNumber: string | null;
  };
}

export interface CreateCustomerInput {
  name: string;
  emailContato: string;
  cpfCnpj?: string;
  domain: string;
  projectDescription: string;
  rentalFee: number;
  whatsappNumber?: string;
}

export interface CustomerAccess {
  email: string;
  temporaryPassword: string | null;
  existingAccount: boolean;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);

  listTenants() {
    return this.http.get<{ tenants: Tenant[] }>(`${API_URL}/tenants`);
  }

  listPayments(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<{ payments: Payment[] }>(`${API_URL}/payments`, { params });
  }

  createCustomer(input: CreateCustomerInput) {
    return this.http.post<{
      message: string;
      tenantId: string;
      asaasPaymentLink: string | null;
      customerAccess: CustomerAccess;
    }>(`${API_URL}/tenants`, input);
  }
}
