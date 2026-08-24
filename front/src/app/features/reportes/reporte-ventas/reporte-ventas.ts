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
  Venta
} from '../../../../core/models/venta.model';

import {
  formatoCLP,
  formatoFecha,
  formatoHora
} from '../../../shared/utils/formato';

@Component({
  selector: 'app-reporte-ventas',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl: './reporte-ventas.html',

  styleUrl: './reporte-ventas.scss'
})
export class ReporteVentas {

  private readonly cafeteria =
    inject(CafeteriaService);

  readonly clp =
    formatoCLP;

  readonly fecha =
    formatoFecha;

  readonly hora =
    formatoHora;

  desde = '';

  hasta = '';

  consultaDesde = '';

  consultaHasta = '';

  detalleId:
    number | null =
    null;


  constructor() {

    const hoy =
      new Date();

    const primerDia =
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      );

    this.desde =
      this.fechaInput(
        primerDia
      );

    this.hasta =
      this.fechaInput(
        hoy
      );

    this.buscar();
  }


  get ventas(): Venta[] {

    return this.cafeteria
      .ventasEntre(
        this.consultaDesde,
        this.consultaHasta
      );
  }


  get totalVentas(): number {

    return this.ventas
      .reduce(
        (total, venta) =>
          total + venta.total,
        0
      );
  }


  get productosVendidos():
    number {

    return this.ventas
      .reduce(
        (total, venta) =>
          total +
          venta.items.reduce(
            (suma, item) =>
              suma +
              item.cantidad,
            0
          ),
        0
      );
  }


  get productoMasVendido():
    string {

    const cantidades =
      new Map<
        string,
        number
      >();

    this.ventas
      .forEach(
        venta =>
          venta.items
            .forEach(
              item => {

                const actual =
                  cantidades.get(
                    item.nombre
                  ) ?? 0;

                cantidades.set(
                  item.nombre,
                  actual +
                  item.cantidad
                );

              })
      );

    let mayor = 0;

    let producto =
      'Sin datos';

    cantidades.forEach(
      (
        cantidad,
        nombre
      ) => {

        if (
          cantidad > mayor
        ) {

          mayor =
            cantidad;

          producto =
            nombre;

        }

      }
    );

    return producto;
  }


  buscar(): void {

    this.consultaDesde =
      this.desde;

    this.consultaHasta =
      this.hasta;
  }


  hoy(): void {

    const fecha =
      this.fechaInput(
        new Date()
      );

    this.desde =
      fecha;

    this.hasta =
      fecha;

    this.buscar();
  }


  mostrarDetalle(
    id: number
  ): void {

    this.detalleId =
      this.detalleId === id
        ? null
        : id;
  }


  cantidadProductos(
    venta: Venta
  ): number {

    return venta.items
      .reduce(
        (total, item) =>
          total +
          item.cantidad,
        0
      );
  }


  private fechaInput(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;
  }
}