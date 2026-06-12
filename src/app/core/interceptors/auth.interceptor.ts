import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Busca o token que salvaremos no localStorage após o login
  const token = localStorage.getItem('access_token');

  // Se o token existir, clona a requisição e injeta o cabeçalho de Autorização
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Dispara a requisição e fica vigiando a resposta da API
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se a API responder 401 (Não Autorizado) ou 403, o token expirou ou é inválido
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('access_token');
        router.navigate(['/login']); // Expulsa de volta pro login
      }
      return throwError(() => error);
    })
  );
};