import { Routes } from '@angular/router';
// Importe o HomeComponent (o VS Code pode te ajudar com o caminho exato)
import { Home } from './pages/home/home'; 

export const routes: Routes = [
  {
    path: '', // O caminho vazio representa a raiz do site (localhost:4200/)
    component: Home,
    title: 'NobreFlow' // O Angular já altera o título da aba do navegador para você!
  },
  // { path: 'login', component: LoginComponent },
  // { 
  //   path: 'painel', 
  //   component: PainelLayoutComponent,
  //   canActivate: [authGuard], // O segurança da porta
  //   children: [
  //     { path: '', component: DashboardComponent },
  //     { path: 'locacoes', component: LocacoesListComponent }
  //   ]
  // }
];