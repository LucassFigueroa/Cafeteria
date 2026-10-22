import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteVentas } from './reporte-ventas';
import { renderizar } from '../../../../testing/renderizar';

/** PI-05 - Integracion Reportes + CafeteriaService (RF-21, RF-22, RF-23). */
describe('PI-05 ReporteVentas', () => {

  let fixture: ComponentFixture<ReporteVentas>;
  let componente: ReporteVentas;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('coffeeflow_ventas', JSON.stringify([
      {
        id: 2, fecha: '2026-09-15T12:30:00', total: 7400, items: [
          { productoId: 1, nombre: 'Cappuccino', cantidad: 2, precioUnitario: 2500, subtotal: 5000 },
          { productoId: 8, nombre: 'Té verde', cantidad: 1, precioUnitario: 2400, subtotal: 2400 }
        ]
      },
      {
        id: 1, fecha: '2026-09-01T09:00:00', total: 5700, items: [
          { productoId: 3, nombre: 'Espresso', cantidad: 3, precioUnitario: 1900, subtotal: 5700 }
        ]
      }
    ]));
    TestBed.configureTestingModule({ imports: [ReporteVentas] });
    fixture = TestBed.createComponent(ReporteVentas);
    componente = fixture.componentInstance;
    renderizar(fixture);
  });

  const consultar = (desde: string, hasta: string) => {
    componente.desde = desde;
    componente.hasta = hasta;
    componente.buscar();
    renderizar(fixture);
  };

  it('PI-05.1 calcula ventas, ingresos, productos vendidos y producto mas vendido del periodo', () => {
    consultar('2026-09-01', '2026-09-30');

    expect(componente.ventas.length).toBe(2);
    expect(componente.totalVentas).toBe(13100);
    expect(componente.productosVendidos).toBe(6);
    expect(componente.productoMasVendido).toBe('Espresso');
    const ingresos = fixture.nativeElement.querySelectorAll('.stats strong')[1] as HTMLElement;
    expect(ingresos.textContent?.trim()).toBe('$13.100');
  });

  it('PI-05.2 muestra fecha dd-mm-aaaa y el detalle expandible de la venta', () => {
    consultar('2026-09-15', '2026-09-15');
    componente.mostrarDetalle(2);
    renderizar(fixture);

    const celdas = fixture.nativeElement.querySelectorAll('tbody tr:first-child td') as NodeListOf<HTMLElement>;
    expect(celdas[1].textContent?.trim()).toBe('15-09-2026');
    expect(celdas[2].textContent?.trim()).toBe('12:30');
    const detalle = fixture.nativeElement.querySelectorAll('.detail-item') as NodeListOf<HTMLElement>;
    expect(detalle.length).toBe(2);
    expect(detalle[0].textContent).toContain('Cappuccino');
    expect(detalle[0].textContent).toContain('$5.000');
  });

  it('PI-05.3 un rango sin ventas muestra totales en 0 y "Sin datos"', () => {
    consultar('2030-01-01', '2030-01-31');

    expect(componente.totalVentas).toBe(0);
    expect(componente.productoMasVendido).toBe('Sin datos');
    expect(fixture.nativeElement.querySelector('td.empty')?.textContent?.trim())
      .toBe('No existen ventas para las fechas seleccionadas.');
  });

  it('PI-05.4 un rango invertido (desde > hasta) no muestra ventas', () => {
    consultar('2026-09-30', '2026-09-01');

    expect(componente.ventas).toEqual([]);
  });
});
