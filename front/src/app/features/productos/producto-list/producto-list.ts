import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
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

@Component({
  selector: 'app-producto-list',

  standalone: true,

  imports: [
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './producto-list.html',

  styleUrl: './producto-list.scss'
})
export class ProductoList {

  private readonly cafeteria =
    inject(CafeteriaService);

  private readonly fb =
    inject(FormBuilder);

  readonly productos =
    this.cafeteria.productos;

  readonly clp =
    formatoCLP;

  busqueda = '';

  categoriaFiltro =
    'Todas';

  modalAbierto =
    false;

  editandoId:
    number | null =
    null;


  readonly form =
    this.fb.nonNullable.group({

      nombre: [
        '',
        Validators.required
      ],

      categoria: [
        'Café',
        Validators.required
      ],

      precio: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      stock: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      activo: [
        true
      ]

    });


  get categorias(): string[] {

    return [
      'Todas',
      ...new Set(
        this.productos()
          .map(
            producto =>
              producto.categoria
          )
      )
    ];
  }


  get productosFiltrados():
    Producto[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.productos()
      .filter(producto => {

        const coincideTexto =
          producto.nombre
            .toLowerCase()
            .includes(texto);

        const coincideCategoria =
          this.categoriaFiltro ===
            'Todas' ||
          producto.categoria ===
            this.categoriaFiltro;

        return (
          coincideTexto &&
          coincideCategoria
        );

      });
  }


  abrirNuevo(): void {

    this.editandoId =
      null;

    this.form.reset({
      nombre: '',
      categoria: 'Café',
      precio: 0,
      stock: 0,
      activo: true
    });

    this.modalAbierto =
      true;
  }


  editar(
    producto: Producto
  ): void {

    this.editandoId =
      producto.id;

    this.form.setValue({

      nombre:
        producto.nombre,

      categoria:
        producto.categoria,

      precio:
        producto.precio,

      stock:
        producto.stock,

      activo:
        producto.activo

    });

    this.modalAbierto =
      true;
  }


  guardar(): void {

    if (
      this.form.invalid
    ) {

      this.form
        .markAllAsTouched();

      return;
    }

    const datos =
      this.form.getRawValue();

    const producto = {

      nombre:
        datos.nombre.trim(),

      categoria:
        datos.categoria,

      precio:
        Number(datos.precio),

      stock:
        Number(datos.stock),

      activo:
        datos.activo

    };

    if (
      this.editandoId ===
      null
    ) {

      this.cafeteria
        .crearProducto(
          producto
        );

    } else {

      this.cafeteria
        .actualizarProducto(
          this.editandoId,
          producto
        );

    }

    this.cerrarModal();
  }


  eliminar(
    producto: Producto
  ): void {

    const confirmar =
      window.confirm(
        `¿Deseas eliminar "${producto.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    this.cafeteria
      .eliminarProducto(
        producto.id
      );
  }


  cerrarModal(): void {

    this.modalAbierto =
      false;

    this.editandoId =
      null;
  }
}