import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  // Se você tiver o módulo de ícones (Lucide), importe aqui também
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

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

    const { email, password } = this.loginForm.value;

    // TODO: Aqui vamos conectar com o seu AuthService que chama a API do Fastify.
    // Por enquanto, vamos simular um login:
    setTimeout(() => {
      if (email === 'teste@teste.com.br' && password === '12345678') {
        // Simula o sucesso e vai para o painel
        this.router.navigate(['/painel']);
      } else {
        // Simula o erro
        this.errorMessage.set('E-mail ou senha incorretos. Tente novamente.');
        this.isLoading.set(false);
      }
    }, 1500);
  }
}