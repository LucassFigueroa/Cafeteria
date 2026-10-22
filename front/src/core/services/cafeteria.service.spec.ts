import { TestBed } from '@angular/core/testing';

import { CafeteriaService } from './cafeteria.service';
import { Producto } from '../models/producto.model';

const PRODUCTOS_KEY = 'coffeeflow_productos';
const VENTAS_KEY = 'coffeeflow_ventas';

function crearServicio(): CafeteriaService {
  return TestBed.inject(CafeteriaService);
}

function producto(servicio: CafeteriaService, nombre: string): Producto {
  const encontrado = servicio.productos().find(p => p.nombre === nombre);
  if (!encontrado) {
    throw new Error(`Producto demo no encontrado: ${nombre}`);
  }
  return encontrado;
}

function guardados<T>(clave: string): T {
  return JSON.parse(localStorage.getItem(clave) ?? 'null') as T;
}

describe('CafeteriaService', () => {

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  /** PU-02 - Carga inicial de datos (RF-24, RNF-09). */
  describe('PU-02 carga de datos', () => {

    it('PU-02.1 sin datos guardados carga 8 productos y 3 ventas demo y los persiste', () => {
      const servicio = crearServicio();

      expect(servicio.productos().length).toBe(8);
      expect(servicio.ventas().length).toBe(3);
      expect(guardados<Producto[]>(PRODUCTOS_KEY).length).toBe(8);
      expect(guardados<unknown[]>(VENTAS_KEY).length).toBe(3);
    });

    it('PU-02.2 con datos guardados los reutiliza en lugar de los datos demo', () => {
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify([
        { id: 50, nombre: 'Mocha', categoria: 'Café', precio: 3100, stock: 3, activo: true }
      ]));
      localStorage.setItem(VENTAS_KEY, '[]');

      const servicio = crearServicio();

      expect(servicio.productos().map(p => p.nombre)).toEqual(['Mocha']);
      expect(servicio.ventas()).toEqual([]);
    });

    // DEFECTO CONOCIDO (CP-17): cargarDatos() hace JSON.parse sin try/catch.
    // Se espera que FALLE hasta que el servicio se recupere con los datos demo.
    it('PU-02.3 con datos corruptos en localStorage se recupera con los datos demo', () => {
      localStorage.setItem(PRODUCTOS_KEY, '{dato-invalido');

      let servicio: CafeteriaService | undefined;
      expect(() => { servicio = crearServicio(); }).not.toThrow();
      expect(servicio?.productos().length).toBe(8);
    });
  });

  /** PU-03 - CRUD de productos (RF-09, RF-10, RF-11, RF-12). */
  describe('PU-03 CRUD de productos', () => {

    it('PU-03.1 crearProducto asigna id = max + 1, lo agrega al inicio y lo persiste', () => {
      const servicio = crearServicio();

      servicio.crearProducto({ nombre: 'Chai Latte', categoria: 'Té', precio: 3200, stock: 10, activo: true });

      const primero = servicio.productos()[0];
      expect(primero).toEqual({ id: 9, nombre: 'Chai Latte', categoria: 'Té', precio: 3200, stock: 10, activo: true });
      expect(guardados<Producto[]>(PRODUCTOS_KEY)[0].nombre).toBe('Chai Latte');
    });

    it('PU-03.2 crearProducto sin productos previos asigna id 1', () => {
      localStorage.setItem(PRODUCTOS_KEY, '[]');
      const servicio = crearServicio();

      servicio.crearProducto({ nombre: 'Agua', categoria: 'Bebida', precio: 900, stock: 5, activo: true });

      expect(servicio.productos()[0].id).toBe(1);
    });

    it('PU-03.3 actualizarProducto modifica solo el producto indicado y conserva su id', () => {
      const servicio = crearServicio();
      const latte = producto(servicio, 'Latte');

      servicio.actualizarProducto(latte.id, { ...latte, precio: 3000, stock: 20 });

      expect(producto(servicio, 'Latte')).toMatchObject({ id: latte.id, precio: 3000, stock: 20 });
      expect(producto(servicio, 'Cappuccino').precio).toBe(2500);
      expect(guardados<Producto[]>(PRODUCTOS_KEY).find(p => p.id === latte.id)?.precio).toBe(3000);
    });

    it('PU-03.4 eliminarProducto quita el producto del estado y del almacenamiento', () => {
      const servicio = crearServicio();
      const espresso = producto(servicio, 'Espresso');

      servicio.eliminarProducto(espresso.id);

      expect(servicio.productos().some(p => p.id === espresso.id)).toBe(false);
      expect(guardados<Producto[]>(PRODUCTOS_KEY).length).toBe(7);
    });
  });

  /** PU-04 - Registro de ventas (RF-19, RF-20, RNF-13). */
  describe('PU-04 registrarVenta', () => {

    it('PU-04.1 rechaza una venta sin items', () => {
      const servicio = crearServicio();

      expect(servicio.registrarVenta([])).toEqual({ ok: false, mensaje: 'No existen productos en la venta.' });
      expect(servicio.ventas().length).toBe(3);
    });

    it('PU-04.2 rechaza un producto inexistente', () => {
      const servicio = crearServicio();

      const resultado = servicio.registrarVenta([{ productoId: 999, cantidad: 1 }]);

      expect(resultado.ok).toBe(false);
      expect(resultado.mensaje).toBe('Uno de los productos ya no existe.');
    });

    it('PU-04.3 rechaza un producto desactivado sin descontar stock', () => {
      const servicio = crearServicio();
      const te = producto(servicio, 'Té verde');
      servicio.actualizarProducto(te.id, { ...te, activo: false });

      const resultado = servicio.registrarVenta([{ productoId: te.id, cantidad: 1 }]);

      expect(resultado).toEqual({ ok: false, mensaje: 'Té verde está desactivado.' });
      expect(producto(servicio, 'Té verde').stock).toBe(12);
    });

    it('PU-04.4 rechaza una cantidad mayor al stock (valor limite stock + 1)', () => {
      const servicio = crearServicio();
      const muffin = producto(servicio, 'Muffin de chocolate');

      const resultado = servicio.registrarVenta([{ productoId: muffin.id, cantidad: 5 }]);

      expect(resultado).toEqual({ ok: false, mensaje: 'Stock insuficiente para Muffin de chocolate.' });
      expect(producto(servicio, 'Muffin de chocolate').stock).toBe(4);
    });

    it('PU-04.5 acepta vender exactamente el stock disponible (valor limite) y deja stock 0', () => {
      const servicio = crearServicio();
      const muffin = producto(servicio, 'Muffin de chocolate');

      const resultado = servicio.registrarVenta([{ productoId: muffin.id, cantidad: 4 }]);

      expect(resultado.ok).toBe(true);
      expect(producto(servicio, 'Muffin de chocolate').stock).toBe(0);
    });

    it('PU-04.6 calcula subtotales y total, asigna id correlativo y descuenta stock', () => {
      const servicio = crearServicio();

      const resultado = servicio.registrarVenta([
        { productoId: 1, cantidad: 2 },
        { productoId: 5, cantidad: 1 }
      ]);

      expect(resultado.ok).toBe(true);
      expect(resultado.mensaje).toBe('Venta #1004 registrada correctamente.');
      expect(resultado.venta?.total).toBe(6900);
      expect(resultado.venta?.items.map(i => i.subtotal)).toEqual([5000, 1900]);
      expect(producto(servicio, 'Cappuccino').stock).toBe(18);
      expect(producto(servicio, 'Croissant').stock).toBe(7);
      expect(servicio.ventas()[0].id).toBe(1004);
    });

    it('PU-04.7 persiste la venta y el stock en localStorage', () => {
      const servicio = crearServicio();

      servicio.registrarVenta([{ productoId: 1, cantidad: 2 }]);

      expect(guardados<unknown[]>(VENTAS_KEY).length).toBe(4);
      expect(guardados<Producto[]>(PRODUCTOS_KEY).find(p => p.id === 1)?.stock).toBe(18);
    });

    it('PU-04.8 registra la fecha en formato local aaaa-mm-ddTHH:mm:ss', () => {
      const servicio = crearServicio();

      const resultado = servicio.registrarVenta([{ productoId: 3, cantidad: 1 }]);

      expect(resultado.venta?.fecha).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    // DEFECTO DETECTADO: si la solicitud trae el mismo producto en dos lineas, cada linea se
    // valida por separado contra el stock y el Map de cantidades conserva solo la ultima,
    // por lo que se cobran 25 unidades pero se descuentan 10 (stock inconsistente).
    it('PU-04.9 con el mismo producto repetido valida y descuenta la cantidad acumulada', () => {
      const servicio = crearServicio();

      const resultado = servicio.registrarVenta([
        { productoId: 1, cantidad: 15 },
        { productoId: 1, cantidad: 10 }
      ]);

      // 15 + 10 = 25 > stock 20: la venta debe rechazarse
      expect(resultado.ok).toBe(false);
      expect(producto(servicio, 'Cappuccino').stock).toBe(20);
    });
  });

  /** PU-05 - Consulta de ventas por rango (RF-21). */
  describe('PU-05 ventasEntre', () => {

    beforeEach(() => {
      localStorage.setItem(VENTAS_KEY, JSON.stringify([
        { id: 1, fecha: '2026-09-01T10:00:00', total: 1000, items: [] },
        { id: 2, fecha: '2026-09-15T12:00:00', total: 2000, items: [] },
        { id: 3, fecha: '2026-09-30T23:59:59', total: 3000, items: [] }
      ]));
    });

    it('PU-05.1 incluye los extremos del rango y ordena de la mas reciente a la mas antigua', () => {
      const servicio = crearServicio();

      expect(servicio.ventasEntre('2026-09-01', '2026-09-30').map(v => v.id)).toEqual([3, 2, 1]);
    });

    it('PU-05.2 filtra por un unico dia', () => {
      const servicio = crearServicio();

      expect(servicio.ventasEntre('2026-09-15', '2026-09-15').map(v => v.id)).toEqual([2]);
    });

    it('PU-05.3 sin fechas devuelve todas las ventas', () => {
      const servicio = crearServicio();

      expect(servicio.ventasEntre('', '').length).toBe(3);
    });

    it('PU-05.4 un rango sin ventas o invertido devuelve una lista vacia', () => {
      const servicio = crearServicio();

      expect(servicio.ventasEntre('2027-01-01', '2027-01-31')).toEqual([]);
      expect(servicio.ventasEntre('2026-09-30', '2026-09-01')).toEqual([]);
    });
  });
});
