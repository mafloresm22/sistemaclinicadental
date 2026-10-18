import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  // Redirigir al login si no tiene sesión activa
  router.navigate(['/login']);
  return false;
};

/**
 * Guard para evitar que un usuario ya autenticado entre a /login o /register
 */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    router.navigate(['/dashboard/inicio']);
    return false;
  }

  return true;
};
