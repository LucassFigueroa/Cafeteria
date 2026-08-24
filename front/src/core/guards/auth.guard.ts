import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);

  const logged =
    localStorage.getItem(
      'coffeeflow_logged'
    );

  if (logged === 'true') {
    return true;
  }

  return router.createUrlTree([
    '/login'
  ]);
};