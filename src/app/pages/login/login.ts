import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Sinais (Signals) para controlar a tela como o seu HTML pediu
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // O formulário reativo
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();
    if (!email || !password) return;

    this.authService.login(email, password).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => void this.router.navigate(['/painel']),
      error: (error) => {
        this.errorMessage.set(
          error.error?.message ?? 'Não foi possível entrar. Verifique os dados e tente novamente.',
        );
      },
    });
  }
}
