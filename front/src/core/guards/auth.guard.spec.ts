import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';

/** PU-06 - Guard de autenticacion (RF-04, RNF-05). */
describe('PU-06 authGuard (core/guards)', () => {

  const ejecutar = () => TestBed.runInInjectionContext(
    () => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('PU-06.1 con sesion activa permite el acceso', () => {
    localStorage.setItem('coffeeflow_logged', 'true');

    expect(ejecutar()).toBe(true);
  });

  it('PU-06.2 sin sesion redirige a /login', () => {
    const resultado = ejecutar();

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('PU-06.3 un valor distinto de "true" no se considera sesion valida', () => {
    localStorage.setItem('coffeeflow_logged', 'false');

    expect(ejecutar()).toBeInstanceOf(UrlTree);
  });
});
