import { Routes } from '@angular/router';
// Importe o HomeComponent (o VS Code pode te ajudar com o caminho exato)
import { Home } from './pages/home/home'; 

export const routes: Routes = [
  {
    path: '', // O caminho vazio representa a raiz do site (localhost:4200/)
    component: Home,
    title: 'NobreFlow' // O Angular já altera o título da aba do navegador para você!
  },
  // Futuramente, você adicionará outras rotas aqui embaixo, por exemplo:
  // { path: 'dashboard', component: DashboardComponent }
];