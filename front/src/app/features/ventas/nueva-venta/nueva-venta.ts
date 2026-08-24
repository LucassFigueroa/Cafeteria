import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  CafeteriaService
} from '../../../../core/services/cafeteria.service';

import {
  Producto
} from '../../../../core/models/producto.model';

import {
  formatoCLP
} from '../../../shared/utils/formato';

interface CarritoItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

@Component({
  selector: 'app-nueva-venta',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './nueva-venta.html',

  styleUrl: './nueva-venta.scss'
})
export class NuevaVenta {

  private readonly cafeteria =
    inject(CafeteriaService);

  readonly productos =
    this.cafeteria.productos;

  readonly clp =
    formatoCLP;

  busqueda = '';

  categoriaFiltro =
    'Todas';

  carrito:
    CarritoItem[] =
    [];

  mensaje = '';

  mensajeOk =
    false;


  get categorias(): string[] {

    return [
      'Todas',
      ...new Set(
        this.productos()
          .filter(p => p.activo)
          .map(p => p.categoria)
      )
    ];
  }


  get productosDisponibles():
    Producto[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.productos()
      .filter(
        producto =>
          producto.activo &&
          producto.nombre
            .toLowerCase()
            .includes(texto) &&
          (
            this.categoriaFiltro ===
              'Todas' ||
            producto.categoria ===
              this.categoriaFiltro
          )
      );
  }


  get total(): number {

    return this.carrito
      .reduce(
        (suma, item) =>
          suma +
          item.precio *
          item.cantidad,
        0
      );
  }


  agregar(
    producto: Producto
  ): void {

    this.limpiarMensaje();

    const existente =
      this.carrito.find(
        item =>
          item.productoId ===
          producto.id
      );

    const cantidadActual =
      existente?.cantidad ?? 0;

    if (
      cantidadActual >=
      producto.stock
    ) {

      this.mostrarError(
        `No queda más stock de ${producto.nombre}.`
      );

      return;
    }

    if (existente) {

      existente.cantidad++;

    } else {

      this.carrito.push({

        productoId:
          producto.id,

        nombre:
          producto.nombre,

        precio:
          producto.precio,

        cantidad: 1

      });

    }
  }


  incrementar(
    item: CarritoItem
  ): void {

    const producto =
      this.productos()
        .find(
          p =>
            p.id ===
            item.productoId
        );

    if (!producto) {
      return;
    }

    if (
      item.cantidad >=
      producto.stock
    ) {

      this.mostrarError(
        'No hay más stock disponible.'
      );

      return;
    }

    item.cantidad++;

    this.limpiarMensaje();
  }


  disminuir(
    item: CarritoItem
  ): void {

    if (
      item.cantidad <= 1
    ) {

      this.quitar(item);

      return;
    }

    item.cantidad--;
  }


  quitar(
    item: CarritoItem
  ): void {

    this.carrito =
      this.carrito.filter(
        actual =>
          actual.productoId !==
          item.productoId
      );
  }


  confirmarVenta(): void {

    if (
      this.carrito.length === 0
    ) {

      this.mostrarError(
        'Agrega al menos un producto.'
      );

      return;
    }

    const resultado =
      this.cafeteria
        .registrarVenta(
          this.carrito.map(
            item => ({
              productoId:
                item.productoId,

              cantidad:
                item.cantidad
            })
          )
        );

    this.mensaje =
      resultado.mensaje;

    this.mensajeOk =
      resultado.ok;

    if (
      resultado.ok
    ) {

      this.carrito = [];
    }
  }


  private mostrarError(
    mensaje: string
  ): void {

    this.mensaje =
      mensaje;

    this.mensajeOk =
      false;
  }


  private limpiarMensaje():
    void {

    this.mensaje = '';
  }
}