// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { authGuard, noAuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard/inicio',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/inicio',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'dashboard/default',
        redirectTo: '/dashboard/inicio',
        pathMatch: 'full'
      },
      {
        path: 'typography',
        loadComponent: () => import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent)
      },
      {
        path: 'especialidades',
        loadComponent: () => import('./layouts/especialidades/especialidades.component').then((c) => c.EspecialidadesComponent)
      },
      {
        path: 'infraestructura',
        loadComponent: () => import('./layouts/infraestructura/infraestructura.component').then((c) => c.InfraestructuraComponent)
      },
      {
        path: 'tratamientos',
        loadComponent: () => import('./layouts/tratamientos/tratamientos.component').then((c) => c.TratamientosComponent)
      },
      {
        path: 'doctores',
        loadComponent: () => import('./layouts/doctores/doctores.component').then((c) => c.DoctoresComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./layouts/pacientes/pacientes.component').then((c) => c.PacientesComponent)
      },
      {
        path: 'piezas-dentales',
        loadComponent: () => import('./layouts/piezas-dentales/piezas-dentales.component').then((c) => c.PiezasDentalesComponent)
      },
      {
        path: 'piezas-dentales/editar-piezas',
        loadComponent: () => import('./layouts/piezas-dentales/editar-piezas-dentales/editar-piezas-dentales.component').then((c) => c.EditarPiezasDentalesComponent)
      }
    ]
  },
  {
    path: '',
    component: GuestLayoutComponent,
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
