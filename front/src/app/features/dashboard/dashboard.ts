import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  CafeteriaService
} from '../../../core/services/cafeteria.service';

import {
  Venta
} from '../../../core/models/venta.model';

import {
  formatoCLP,
  formatoHora
} from '../../shared/utils/formato';

@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.scss'
})
export class Dashboard {

  private readonly cafeteria =
    inject(CafeteriaService);

  readonly productos =
    this.cafeteria.productos;

  readonly ventas =
    this.cafeteria.ventas;

  readonly clp =
    formatoCLP;

  readonly hora =
    formatoHora;

  readonly hoy =
    this.fechaActual();


  readonly ventasHoy =
    computed(() =>
      this.ventas().filter(
        venta =>
          venta.fecha.substring(
            0,
            10
          ) === this.hoy
      )
    );


  readonly totalHoy =
    computed(() =>
      this.ventasHoy().reduce(
        (total, venta) =>
          total + venta.total,
        0
      )
    );


  readonly stockBajo =
    computed(() =>
      this.productos().filter(
        producto =>
          producto.activo &&
          producto.stock <= 5
      )
    );


  readonly ultimasVentas =
    computed(() =>
      this.ventas()
        .slice(0, 5)
    );


  cantidadItems(
    venta: Venta
  ): number {

    return venta.items.reduce(
      (total, item) =>
        total + item.cantidad,
      0
    );
  }


  private fechaActual(): string {

    const date =
      new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}