import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, tap, throwError } from 'rxjs';
import { API_URL } from '../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const rawHttp = new HttpClient(inject(HttpBackend));
  
  // Busca o token que salvaremos no localStorage após o login
  const token = localStorage.getItem('access_token');

  // Se o token existir, clona a requisição e injeta o cabeçalho de Autorização
  let authReq = req;
  if (token && req.url.startsWith(API_URL)) {
    authReq = req.clone({
      withCredentials: true,
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Dispara a requisição e fica vigiando a resposta da API
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se a API responder 401 (Não Autorizado) ou 403, o token expirou ou é inválido
      const isAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
      if (error.status === 401 && !isAuthRoute) {
        return rawHttp.post<{ accessToken: string }>(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        }).pipe(
          tap(({ accessToken }) => localStorage.setItem('access_token', accessToken)),
          switchMap(({ accessToken }) => next(req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${accessToken}` },
          }))),
          catchError((refreshError) => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('auth_user');
            void router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      if (error.status === 403 && !isAuthRoute) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
