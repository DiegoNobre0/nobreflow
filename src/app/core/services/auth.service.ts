import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { API_URL } from '../config/api.config';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  mustChangePassword: boolean;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    }, { withCredentials: true }).pipe(
      tap(({ accessToken, user }) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }),
    );
  }

  user(): AuthUser | null {
    const stored = localStorage.getItem('auth_user');
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      this.clearSession();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('access_token'));
  }

  logout(): void {
    this.http.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
  }

  refresh() {
    return this.http.post<{ accessToken: string }>(`${API_URL}/auth/refresh`, {}, {
      withCredentials: true,
    }).pipe(
      tap(({ accessToken }) => localStorage.setItem('access_token', accessToken)),
    );
  }

  restoreSession() {
    return this.refresh().pipe(
      switchMap(() => this.http.get<{ user: AuthUser }>(`${API_URL}/auth/me`)),
      tap(({ user }) => localStorage.setItem('auth_user', JSON.stringify(user))),
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<{ message: string; user: AuthUser }>(`${API_URL}/auth/change-password`, {
      currentPassword,
      newPassword,
    }).pipe(
      tap(({ user }) => localStorage.setItem('auth_user', JSON.stringify(user))),
    );
  }

  private finishLogout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
}
