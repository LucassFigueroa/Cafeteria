import { Injectable, signal } from '@angular/core';

import { Producto } from '../models/producto.model';
import {
  Venta,
  VentaItem,
  VentaRequestItem
} from '../models/venta.model';

export interface ResultadoVenta {
  ok: boolean;
  mensaje: string;
  venta?: Venta;
}

@Injectable({
  providedIn: 'root'
})
export class CafeteriaService {

  private readonly PRODUCTOS_KEY = 'coffeeflow_productos';
  private readonly VENTAS_KEY = 'coffeeflow_ventas';

  private readonly productosState = signal<Producto[]>([]);
  private readonly ventasState = signal<Venta[]>([]);

  readonly productos = this.productosState.asReadonly();
  readonly ventas = this.ventasState.asReadonly();

  constructor() {
    this.cargarDatos();
  }

  // =====================================================
  // DATOS INICIALES
  // =====================================================

  private cargarDatos(): void {

    const productosGuardados =
      localStorage.getItem(this.PRODUCTOS_KEY);

    const ventasGuardadas =
      localStorage.getItem(this.VENTAS_KEY);

    if (productosGuardados) {

      this.productosState.set(
        JSON.parse(productosGuardados)
      );

    } else {

      const productos = this.productosDemo();

      this.productosState.set(productos);

      this.guardarProductos();
    }

    if (ventasGuardadas) {

      this.ventasState.set(
        JSON.parse(ventasGuardadas)
      );

    } else {

      const ventas = this.ventasDemo();

      this.ventasState.set(ventas);

      this.guardarVentas();
    }
  }

  private productosDemo(): Producto[] {

    return [
      {
        id: 1,
        nombre: 'Cappuccino',
        categoria: 'Café',
        precio: 2500,
        stock: 20,
        activo: true
      },
      {
        id: 2,
        nombre: 'Latte',
        categoria: 'Café',
        precio: 2800,
        stock: 15,
        activo: true
      },
      {
        id: 3,
        nombre: 'Espresso',
        categoria: 'Café',
        precio: 1900,
        stock: 25,
        activo: true
      },
      {
        id: 4,
        nombre: 'Americano',
        categoria: 'Café',
        precio: 2200,
        stock: 18,
        activo: true
      },
      {
        id: 5,
        nombre: 'Croissant',
        categoria: 'Pastelería',
        precio: 1900,
        stock: 8,
        activo: true
      },
      {
        id: 6,
        nombre: 'Muffin de chocolate',
        categoria: 'Pastelería',
        precio: 2300,
        stock: 4,
        activo: true
      },
      {
        id: 7,
        nombre: 'Sándwich ave palta',
        categoria: 'Sándwich',
        precio: 4200,
        stock: 7,
        activo: true
      },
      {
        id: 8,
        nombre: 'Té verde',
        categoria: 'Té',
        precio: 1800,
        stock: 12,
        activo: true
      }
    ];
  }

  private ventasDemo(): Venta[] {

    const hoy = this.fechaLocal(new Date());

    return [
      {
        id: 1003,
        fecha: `${hoy}T11:20:00`,
        total: 6900,
        items: [
          {
            productoId: 1,
            nombre: 'Cappuccino',
            cantidad: 2,
            precioUnitario: 2500,
            subtotal: 5000
          },
          {
            productoId: 5,
            nombre: 'Croissant',
            cantidad: 1,
            precioUnitario: 1900,
            subtotal: 1900
          }
        ]
      },
      {
        id: 1002,
        fecha: `${hoy}T10:05:00`,
        total: 5000,
        items: [
          {
            productoId: 2,
            nombre: 'Latte',
            cantidad: 1,
            precioUnitario: 2800,
            subtotal: 2800
          },
          {
            productoId: 4,
            nombre: 'Americano',
            cantidad: 1,
            precioUnitario: 2200,
            subtotal: 2200
          }
        ]
      },
      {
        id: 1001,
        fecha: `${hoy}T09:15:00`,
        total: 4200,
        items: [
          {
            productoId: 7,
            nombre: 'Sándwich ave palta',
            cantidad: 1,
            precioUnitario: 4200,
            subtotal: 4200
          }
        ]
      }
    ];
  }

  // =====================================================
  // CRUD PRODUCTOS
  // =====================================================

  crearProducto(
    producto: Omit<Producto, 'id'>
  ): void {

    const productos = this.productosState();

    const nuevoId =
      productos.length > 0
        ? Math.max(...productos.map(p => p.id)) + 1
        : 1;

    const nuevoProducto: Producto = {
      id: nuevoId,
      ...producto
    };

    this.productosState.update(
      actuales => [
        nuevoProducto,
        ...actuales
      ]
    );

    this.guardarProductos();
  }

  actualizarProducto(
    id: number,
    cambios: Omit<Producto, 'id'>
  ): void {

    this.productosState.update(
      productos =>
        productos.map(producto =>
          producto.id === id
            ? {
                id,
                ...cambios
              }
            : producto
        )
    );

    this.guardarProductos();
  }

  eliminarProducto(id: number): void {

    this.productosState.update(
      productos =>
        productos.filter(
          producto => producto.id !== id
        )
    );

    this.guardarProductos();
  }

  // =====================================================
  // VENTAS
  // =====================================================

  registrarVenta(
    items: VentaRequestItem[]
  ): ResultadoVenta {

    if (items.length === 0) {

      return {
        ok: false,
        mensaje: 'No existen productos en la venta.'
      };
    }

    const productosActuales =
      this.productosState();

    const detalleVenta: VentaItem[] = [];

    for (const item of items) {

      const producto =
        productosActuales.find(
          p => p.id === item.productoId
        );

      if (!producto) {

        return {
          ok: false,
          mensaje: 'Uno de los productos ya no existe.'
        };
      }

      if (!producto.activo) {

        return {
          ok: false,
          mensaje: `${producto.nombre} está desactivado.`
        };
      }

      if (producto.stock < item.cantidad) {

        return {
          ok: false,
          mensaje: `Stock insuficiente para ${producto.nombre}.`
        };
      }

      detalleVenta.push({
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * item.cantidad
      });
    }

    const total =
      detalleVenta.reduce(
        (suma, item) =>
          suma + item.subtotal,
        0
      );

    const ventasActuales =
      this.ventasState();

    const nuevoId =
      ventasActuales.length > 0
        ? Math.max(
            ...ventasActuales.map(v => v.id)
          ) + 1
        : 1001;

    const venta: Venta = {
      id: nuevoId,
      fecha: this.fechaHoraLocal(new Date()),
      total,
      items: detalleVenta
    };

    const cantidades =
      new Map<number, number>();

    items.forEach(item =>
      cantidades.set(
        item.productoId,
        item.cantidad
      )
    );

    this.productosState.update(
      productos =>
        productos.map(producto => {

          const cantidad =
            cantidades.get(producto.id) ?? 0;

          return {
            ...producto,
            stock: producto.stock - cantidad
          };
        })
    );

    this.ventasState.update(
      ventas => [
        venta,
        ...ventas
      ]
    );

    this.guardarProductos();
    this.guardarVentas();

    return {
      ok: true,
      mensaje: `Venta #${venta.id} registrada correctamente.`,
      venta
    };
  }

  // =====================================================
  // REPORTES
  // =====================================================

  ventasEntre(
    desde: string,
    hasta: string
  ): Venta[] {

    const inicio =
      desde || '0000-01-01';

    const fin =
      hasta || '9999-12-31';

    return this.ventasState()
      .filter(venta => {

        const fecha =
          venta.fecha.substring(0, 10);

        return (
          fecha >= inicio &&
          fecha <= fin
        );

      })
      .sort(
        (a, b) =>
          b.fecha.localeCompare(a.fecha)
      );
  }

  // =====================================================
  // LOCAL STORAGE
  // =====================================================

  private guardarProductos(): void {

    localStorage.setItem(
      this.PRODUCTOS_KEY,
      JSON.stringify(
        this.productosState()
      )
    );
  }

  private guardarVentas(): void {

    localStorage.setItem(
      this.VENTAS_KEY,
      JSON.stringify(
        this.ventasState()
      )
    );
  }

  // =====================================================
  // FECHAS
  // =====================================================

  private fechaLocal(
    fecha: Date
  ): string {

    const year =
      fecha.getFullYear();

    const month =
      String(
        fecha.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        fecha.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private fechaHoraLocal(
    fecha: Date
  ): string {

    const dia =
      this.fechaLocal(fecha);

    const hora =
      String(
        fecha.getHours()
      ).padStart(2, '0');

    const minutos =
      String(
        fecha.getMinutes()
      ).padStart(2, '0');

    const segundos =
      String(
        fecha.getSeconds()
      ).padStart(2, '0');

    return `${dia}T${hora}:${minutos}:${segundos}`;
  }
}