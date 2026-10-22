import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaVenta } from './nueva-venta';
import { CafeteriaService } from '../../../../core/services/cafeteria.service';
import { Producto } from '../../../../core/models/producto.model';
import { renderizar } from '../../../../testing/renderizar';

/** PI-03 - Integracion Nueva Venta + CafeteriaService + localStorage (RF-16 a RF-20). */
describe('PI-03 NuevaVenta', () => {

  let fixture: ComponentFixture<NuevaVenta>;
  let componente: NuevaVenta;
  let servicio: CafeteriaService;

  const producto = (nombre: string): Producto =>
    servicio.productos().find(p => p.nombre === nombre) as Producto;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [NuevaVenta] });
    fixture = TestBed.createComponent(NuevaVenta);
    componente = fixture.componentInstance;
    servicio = TestBed.inject(CafeteriaService);
    renderizar(fixture);
  });

  it('PI-03.1 la grilla muestra solo productos activos', () => {
    const te = producto('Té verde');
    servicio.actualizarProducto(te.id, { ...te, activo: false });
    renderizar(fixture);

    const nombres = Array.from(fixture.nativeElement.querySelectorAll('article.product-card h3'))
      .map(h => (h as HTMLElement).textContent?.trim());
    expect(nombres).not.toContain('Té verde');
    expect(nombres.length).toBe(7);
  });

  it('PI-03.2 agregar respeta el stock: la 5.a unidad de un producto con stock 4 se rechaza', () => {
    const muffin = producto('Muffin de chocolate');

    for (let i = 0; i < 5; i++) {
      componente.agregar(muffin);
    }

    expect(componente.carrito[0].cantidad).toBe(4);
    expect(componente.mensaje).toBe('No queda más stock de Muffin de chocolate.');
    expect(componente.mensajeOk).toBe(false);
  });

  it('PI-03.3 el total del carrito suma precio x cantidad y se muestra en CLP', () => {
    componente.agregar(producto('Cappuccino'));
    componente.agregar(producto('Cappuccino'));
    componente.agregar(producto('Croissant'));
    renderizar(fixture);

    expect(componente.total).toBe(6900);
    const total = fixture.nativeElement.querySelector('.cart-footer .total strong') as HTMLElement;
    expect(total.textContent?.trim()).toBe('$6.900');
  });

  it('PI-03.4 disminuir hasta 0 quita el item del carrito', () => {
    componente.agregar(producto('Latte'));
    componente.incrementar(componente.carrito[0]);

    componente.disminuir(componente.carrito[0]);
    componente.disminuir(componente.carrito[0]);

    expect(componente.carrito.length).toBe(0);
  });

  it('PI-03.5 confirmar venta registra la transaccion, descuenta stock, persiste y vacia el carrito', () => {
    componente.agregar(producto('Cappuccino'));
    componente.agregar(producto('Cappuccino'));

    componente.confirmarVenta();

    expect(componente.mensajeOk).toBe(true);
    expect(componente.mensaje).toBe('Venta #1004 registrada correctamente.');
    expect(componente.carrito).toEqual([]);
    expect(producto('Cappuccino').stock).toBe(18);
    const ventas = JSON.parse(localStorage.getItem('coffeeflow_ventas') as string);
    expect(ventas[0]).toMatchObject({ id: 1004, total: 5000 });
  });

  it('PI-03.6 confirmar con el carrito vacio muestra un error y no registra ventas', () => {
    componente.confirmarVenta();

    expect(componente.mensaje).toBe('Agrega al menos un producto.');
    expect(servicio.ventas().length).toBe(3);
  });

  it('PI-03.7 si el producto se desactiva despues de agregarlo, la venta se rechaza', () => {
    const croissant = producto('Croissant');
    componente.agregar(croissant);
    servicio.actualizarProducto(croissant.id, { ...croissant, activo: false });

    componente.confirmarVenta();

    expect(componente.mensajeOk).toBe(false);
    expect(componente.mensaje).toBe('Croissant está desactivado.');
    expect(servicio.ventas().length).toBe(3);
  });

  it('PI-03.8 el buscador filtra por nombre sin distinguir mayusculas', () => {
    componente.busqueda = 'CAPP';

    expect(componente.productosDisponibles.map(p => p.nombre)).toEqual(['Cappuccino']);
  });
});
