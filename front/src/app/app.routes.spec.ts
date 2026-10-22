import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

/**
 * PI-01 - Integracion Router + guard + layout (RF-01, RF-04, RNF-05).
 * Se usa la configuracion real de rutas (app.routes.ts).
 */
describe('PI-01 rutas protegidas (app.routes)', () => {

  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  it('PI-01.1 con sesion activa /productos carga el modulo Productos', async () => {
    localStorage.setItem('coffeeflow_logged', 'true');

    await harness.navigateByUrl('/productos');

    expect(TestBed.inject(Router).url).toBe('/productos');
    expect(harness.routeNativeElement?.textContent).toContain('Productos');
  });

  it('PI-01.2 una ruta desconocida redirige a /login', async () => {
    await harness.navigateByUrl('/no-existe');

    expect(TestBed.inject(Router).url).toBe('/login');
  });

  // DEFECTO CONOCIDO (CP-04): app.routes.ts declara "export const authGuard = () => true;"
  // en lugar de importar el guard real. Se espera que FALLE hasta corregirlo.
  it.each(['/dashboard', '/productos', '/ventas', '/reportes'])(
    'PI-01.3 sin sesion %s redirige a /login',
    async ruta => {
      await harness.navigateByUrl(ruta);

      expect(TestBed.inject(Router).url).toBe('/login');
    }
  );
});
