import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoList } from './producto-list';
import { CafeteriaService } from '../../../../core/services/cafeteria.service';
import { Producto } from '../../../../core/models/producto.model';
import { renderizar } from '../../../../testing/renderizar';

/** PI-04 - Integracion Productos + CafeteriaService + localStorage (RF-09 a RF-15). */
describe('PI-04 ProductoList', () => {

  let fixture: ComponentFixture<ProductoList>;
  let componente: ProductoList;
  let servicio: CafeteriaService;

  const producto = (nombre: string): Producto | undefined =>
    servicio.productos().find(p => p.nombre === nombre);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ProductoList] });
    fixture = TestBed.createComponent(ProductoList);
    componente = fixture.componentInstance;
    servicio = TestBed.inject(CafeteriaService);
    renderizar(fixture);
  });

  it('PI-04.1 guardar un producto valido lo crea en el servicio y cierra el modal', () => {
    componente.abrirNuevo();
    componente.form.setValue({ nombre: '  Chai Latte ', categoria: 'Té', precio: 3200, stock: 10, activo: true });

    componente.guardar();
    renderizar(fixture);

    expect(producto('Chai Latte')).toMatchObject({ categoria: 'Té', precio: 3200, stock: 10, activo: true });
    expect(componente.modalAbierto).toBe(false);
    const primeraFila = fixture.nativeElement.querySelector('tbody tr strong') as HTMLElement;
    expect(primeraFila.textContent?.trim()).toBe('Chai Latte');
  });

  it.each([
    ['nombre vacio', { nombre: '', precio: 1000, stock: 1 }],
    ['precio 0', { nombre: 'X', precio: 0, stock: 1 }],
    ['precio negativo', { nombre: 'X', precio: -100, stock: 1 }],
    ['stock negativo', { nombre: 'X', precio: 1000, stock: -1 }]
  ])('PI-04.2 no guarda con %s (validaciones del formulario)', (_caso, datos) => {
    componente.abrirNuevo();
    componente.form.patchValue(datos);

    componente.guardar();

    expect(componente.form.invalid).toBe(true);
    expect(componente.modalAbierto).toBe(true);
    expect(servicio.productos().length).toBe(8);
  });

  it('PI-04.3 acepta los valores limite validos precio 1 y stock 0', () => {
    componente.abrirNuevo();
    componente.form.patchValue({ nombre: 'Limite', precio: 1, stock: 0 });

    componente.guardar();

    expect(producto('Limite')).toMatchObject({ precio: 1, stock: 0 });
  });

  it('PI-04.4 editar precarga el formulario y actualiza el producto persistido', () => {
    const latte = producto('Latte') as Producto;

    componente.editar(latte);
    expect(componente.form.getRawValue()).toMatchObject({ nombre: 'Latte', precio: 2800 });
    componente.form.patchValue({ precio: 3000, stock: 20 });
    componente.guardar();

    expect(producto('Latte')).toMatchObject({ id: latte.id, precio: 3000, stock: 20 });
    const guardado = JSON.parse(localStorage.getItem('coffeeflow_productos') as string) as Producto[];
    expect(guardado.find(p => p.id === latte.id)?.precio).toBe(3000);
  });

  it('PI-04.5 eliminar solo borra cuando el usuario confirma', () => {
    const espresso = producto('Espresso') as Producto;
    const confirmar = vi.spyOn(window, 'confirm');

    confirmar.mockReturnValueOnce(false);
    componente.eliminar(espresso);
    expect(producto('Espresso')).toBeDefined();

    confirmar.mockReturnValueOnce(true);
    componente.eliminar(espresso);
    expect(producto('Espresso')).toBeUndefined();
    expect(confirmar).toHaveBeenCalledWith('¿Deseas eliminar "Espresso"?');
  });

  it('PI-04.6 la busqueda y el filtro de categoria se combinan', () => {
    componente.busqueda = 'capp';
    expect(componente.productosFiltrados.map(p => p.nombre)).toEqual(['Cappuccino']);

    componente.busqueda = '';
    componente.categoriaFiltro = 'Café';
    expect(componente.productosFiltrados.every(p => p.categoria === 'Café')).toBe(true);

    componente.busqueda = 'cro';
    expect(componente.productosFiltrados).toEqual([]);
  });
});
