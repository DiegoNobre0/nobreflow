import { Routes } from '@angular/router';
// Importe o HomeComponent (o VS Code pode te ajudar com o caminho exato)
import { Home } from './pages/home/home'; 
import { LoginComponent } from './pages/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '', // O caminho vazio representa a raiz do site (localhost:4200/)
    component: Home,
    title: 'NobreFlow | Sistemas, Sites e Automação para Empresas'
  },
  { path: 'login', component: LoginComponent, title: 'Entrar | Nobreflow' },
  {
    path: 'painel',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/panel/panel').then((module) => module.PanelComponent),
    title: 'Painel financeiro | Nobreflow',
  },
  { path: '**', redirectTo: '' },
];
