import { Routes } from '@angular/router';

// AF3 DEF-01: se usa el guard real (antes: export const authGuard = () => true;)
import { authGuard } from '../core/guards/auth.guard';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login)
  },

  {
    path: '',
    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import('./layout/main-layout/main-layout')
        .then(m => m.MainLayout),

    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/producto-list/producto-list')
            .then(m => m.ProductoList)
      },

      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/ventas/nueva-venta/nueva-venta')
            .then(m => m.NuevaVenta)
      },

      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reporte-ventas/reporte-ventas')
            .then(m => m.ReporteVentas)
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];