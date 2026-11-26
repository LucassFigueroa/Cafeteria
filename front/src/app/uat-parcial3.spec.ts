import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './features/auth/login/login';
import { ProductoList } from './features/productos/producto-list/producto-list';
import { NuevaVenta } from './features/ventas/nueva-venta/nueva-venta';
import { ReporteVentas } from './features/reportes/reporte-ventas/reporte-ventas';
import { CafeteriaService } from '../core/services/cafeteria.service';
import { renderizar } from '../testing/renderizar';

/**
 * Parcial 3 - Hallazgos de la evaluacion de usabilidad (cuestionario UAT de 18 preguntas).
 * Cada prueba fija una correccion: antes de corregir el codigo estas pruebas fallan.
 */

describe('UAT-P3 Productos: prevencion de errores y mensajes claros (UAT-01, UAT-02, UAT-06)', () => {

  let fixture: ComponentFixture<ProductoList>;
  let componente: ProductoList;
  let servicio: CafeteriaService;
  let html: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ProductoList] });
    fixture = TestBed.createComponent(ProductoList);
    componente = fixture.componentInstance;
    servicio = TestBed.inject(CafeteriaService);
    html = fixture.nativeElement as HTMLElement;
    renderizar(fixture);
  });

  it('UAT-P3.1 un nombre formado solo por espacios no se guarda (DEF-08)', () => {
    componente.abrirNuevo();
    componente.form.patchValue({ nombre: '     ', precio: 1000, stock: 5 });

    componente.guardar();

    expect(componente.form.invalid).toBe(true);
    expect(servicio.productos().length).toBe(8);
  });

  it.each([
    ['precio con decimales', { nombre: 'X', precio: 1500.5, stock: 3 }],
    ['stock con decimales', { nombre: 'X', precio: 1500, stock: 2.5 }]
  ])('UAT-P3.2 no guarda con %s: CLP y unidades son enteros (DEF-09)', (_caso, datos) => {
    componente.abrirNuevo();
    componente.form.patchValue(datos);

    componente.guardar();

    expect(componente.form.invalid).toBe(true);
    expect(servicio.productos().length).toBe(8);
  });

  it('UAT-P3.3 al guardar con datos invalidos se explica cada error junto al campo (DEF-10)', () => {
    componente.abrirNuevo();
    componente.form.patchValue({ nombre: '', precio: 0, stock: -1 });

    componente.guardar();
    renderizar(fixture);

    const mensajes = Array.from(html.querySelectorAll('.modal .field-error')).map(e => e.textContent?.trim());
    expect(mensajes).toEqual([
      'El nombre es obligatorio.',
      'El precio debe ser un número entero mayor o igual a 1.',
      'El stock debe ser un número entero mayor o igual a 0.'
    ]);
  });

  it('UAT-P3.4 un formulario correcto no muestra mensajes de error', () => {
    componente.abrirNuevo();
    componente.form.patchValue({ nombre: 'Moka', precio: 3000, stock: 4 });
    componente.form.markAllAsTouched();
    renderizar(fixture);

    expect(html.querySelectorAll('.modal .field-error').length).toBe(0);
  });

  it('UAT-P3.5 los botones de solo icono tienen nombre accesible (DEF-11)', () => {
    expect(html.querySelector('button.edit')?.getAttribute('aria-label')).toBe('Editar Cappuccino');
    expect(html.querySelector('button.delete')?.getAttribute('aria-label')).toBe('Eliminar Cappuccino');
    expect(html.querySelector('button.edit')?.getAttribute('title')).toBe('Editar Cappuccino');

    componente.abrirNuevo();
    renderizar(fixture);
    expect(html.querySelector('button.close')?.getAttribute('aria-label')).toBe('Cerrar');
  });

  it('UAT-P3.6 el modulo ofrece ayuda para quien lo usa por primera vez (DEF-12)', () => {
    const ayuda = html.querySelector('details.help');
    expect(ayuda).not.toBeNull();
    expect(ayuda?.textContent).toContain('Cómo agregar o editar un producto');
  });

  it('UAT-P3.12 cada campo tiene su etiqueta asociada y la busqueda tiene nombre (DEF-11, SonarQube S6853)', () => {
    componente.abrirNuevo();
    renderizar(fixture);

    const etiquetas = ['prod-nombre', 'prod-categoria', 'prod-precio', 'prod-stock']
      .map(id => ((html.querySelector('#' + id) as HTMLInputElement).labels?.[0]?.textContent ?? '').trim());

    expect(etiquetas).toEqual(['Nombre', 'Categoría', 'Precio', 'Stock']);
    expect(html.querySelector('.toolbar .search input')?.getAttribute('aria-label')).toBe('Buscar producto');
    expect(html.querySelector('.toolbar select')?.getAttribute('aria-label')).toBe('Filtrar por categoría');
  });
});

describe('UAT-P3 Login: campos obligatorios explicados (UAT-01)', () => {

  it('UAT-P3.7 con usuario y contrasena vacios se indica que campo falta (DEF-10)', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Login);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    renderizar(fixture);

    fixture.componentInstance.form.setValue({ usuario: '', password: '' });
    fixture.componentInstance.ingresar();
    renderizar(fixture);

    const mensajes = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.field-error'))
      .map(e => e.textContent?.trim());
    expect(mensajes).toEqual(['Ingresa tu usuario.', 'Ingresa tu contraseña.']);
    expect(localStorage.getItem('coffeeflow_logged')).toBeNull();
  });
});

describe('UAT-P3 Reportes: rango de fechas invertido (UAT-03)', () => {

  it('UAT-P3.8 si Desde es posterior a Hasta se avisa en lugar de mostrar "no hay ventas" (DEF-13)', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ReporteVentas] });
    const fixture = TestBed.createComponent(ReporteVentas);
    renderizar(fixture);

    fixture.componentInstance.desde = '2026-12-31';
    fixture.componentInstance.hasta = '2026-01-01';
    fixture.componentInstance.buscar();
    renderizar(fixture);

    const aviso = (fixture.nativeElement as HTMLElement).querySelector('.range-error');
    expect(aviso?.textContent).toContain('«Desde» no puede ser posterior a «Hasta»');
  });

  it('UAT-P3.9 un rango valido no muestra aviso', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ReporteVentas] });
    const fixture = TestBed.createComponent(ReporteVentas);
    renderizar(fixture);

    fixture.componentInstance.desde = '2026-01-01';
    fixture.componentInstance.hasta = '2026-12-31';
    fixture.componentInstance.buscar();
    renderizar(fixture);

    expect((fixture.nativeElement as HTMLElement).querySelector('.range-error')).toBeNull();
  });

  it('UAT-P3.13 las fechas Desde y Hasta tienen su etiqueta asociada (DEF-11, SonarQube S6853)', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ReporteVentas] });
    const fixture = TestBed.createComponent(ReporteVentas);
    renderizar(fixture);

    const html = fixture.nativeElement as HTMLElement;
    const etiquetas = ['rep-desde', 'rep-hasta']
      .map(id => ((html.querySelector('#' + id) as HTMLInputElement).labels?.[0]?.textContent ?? '').trim());

    expect(etiquetas).toEqual(['Desde', 'Hasta']);
  });
});

describe('UAT-P3 Nueva venta: ayuda y acciones identificables (UAT-02, UAT-04)', () => {

  let fixture: ComponentFixture<NuevaVenta>;
  let html: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [NuevaVenta] });
    fixture = TestBed.createComponent(NuevaVenta);
    html = fixture.nativeElement as HTMLElement;
    renderizar(fixture);
  });

  it('UAT-P3.10 muestra una ayuda de tres pasos para registrar una venta (DEF-12)', () => {
    const ayuda = html.querySelector('details.help');
    expect(ayuda).not.toBeNull();
    expect(ayuda?.querySelectorAll('ol li').length).toBe(3);
  });

  it('UAT-P3.11 los botones del pedido indican producto y accion (DEF-11)', () => {
    const cappuccino = TestBed.inject(CafeteriaService).productos().find(p => p.nombre === 'Cappuccino')!;
    fixture.componentInstance.agregar(cappuccino);
    renderizar(fixture);

    expect(html.querySelector('.cart button.remove')?.getAttribute('aria-label')).toBe('Quitar Cappuccino del pedido');
    const cantidad = Array.from(html.querySelectorAll('.cart .quantity button')).map(b => b.getAttribute('aria-label'));
    expect(cantidad).toEqual(['Disminuir cantidad de Cappuccino', 'Aumentar cantidad de Cappuccino']);
  });
});
