import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';
import { CafeteriaService } from '../../../core/services/cafeteria.service';
import { renderizar } from '../../../testing/renderizar';

/** PI-06 - Integracion Dashboard + CafeteriaService (RF-05 a RF-08). */
describe('PI-06 Dashboard', () => {

  let fixture: ComponentFixture<Dashboard>;
  let componente: Dashboard;

  const crear = () => {
    TestBed.configureTestingModule({ imports: [Dashboard] });
    fixture = TestBed.createComponent(Dashboard);
    componente = fixture.componentInstance;
    renderizar(fixture);
  };

  const tarjetas = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.stat-card strong') as NodeListOf<HTMLElement>)
      .map(e => e.textContent?.trim() ?? '');

  beforeEach(() => localStorage.clear());

  it('PI-06.1 con los datos demo muestra $16.100 y 3 ventas del dia', () => {
    crear();

    expect(componente.totalHoy()).toBe(16100);
    expect(tarjetas()).toEqual(['$16.100', '8', '1', '3']);
  });

  it('PI-06.2 stock bajo incluye stock 4 y 5 (limite) pero no 6 ni productos inactivos', () => {
    localStorage.setItem('coffeeflow_productos', JSON.stringify([
      { id: 1, nombre: 'Stock 4', categoria: 'Café', precio: 1000, stock: 4, activo: true },
      { id: 2, nombre: 'Stock 5', categoria: 'Café', precio: 1000, stock: 5, activo: true },
      { id: 3, nombre: 'Stock 6', categoria: 'Café', precio: 1000, stock: 6, activo: true },
      { id: 4, nombre: 'Inactivo', categoria: 'Café', precio: 1000, stock: 1, activo: false }
    ]));
    crear();

    expect(componente.stockBajo().map(p => p.nombre)).toEqual(['Stock 4', 'Stock 5']);
  });

  it('PI-06.3 la tabla muestra solo las 5 ultimas ventas y se actualiza al registrar una venta', () => {
    crear();
    const servicio = TestBed.inject(CafeteriaService);
    for (let i = 0; i < 3; i++) {
      servicio.registrarVenta([{ productoId: 3, cantidad: 1 }]);
    }
    renderizar(fixture);

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(5);
    expect(filas[0].textContent).toContain('#1006');
    expect(componente.ventasHoy().length).toBe(6);
  });

  it('PI-06.4 un dia sin ventas muestra total $0 y 0 ventas sin errores', () => {
    localStorage.setItem('coffeeflow_ventas', '[]');
    crear();

    expect(tarjetas()[0]).toBe('$0');
    expect(tarjetas()[3]).toBe('0');
  });
});
