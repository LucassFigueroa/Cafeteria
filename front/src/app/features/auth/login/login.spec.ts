import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './login';
import { renderizar } from '../../../../testing/renderizar';

/** PI-02 - Integracion Login (formulario reactivo + Router + localStorage) (RF-01, RF-02). */
describe('PI-02 Login', () => {

  let fixture: ComponentFixture<Login>;
  let componente: Login;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(Login);
    componente = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    renderizar(fixture);
  });

  it('PI-02.1 credenciales validas registran la sesion y navegan a /dashboard', () => {
    componente.form.setValue({ usuario: 'admin', password: '1234' });

    componente.ingresar();

    expect(localStorage.getItem('coffeeflow_logged')).toBe('true');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('PI-02.2 credenciales invalidas muestran el error en pantalla y no crean sesion', () => {
    componente.form.setValue({ usuario: 'admin', password: '0000' });

    componente.ingresar();
    renderizar(fixture);

    const error = fixture.nativeElement.querySelector('.login-error') as HTMLElement;
    expect(error.textContent?.trim()).toBe('Usuario o contraseña incorrectos.');
    expect(localStorage.getItem('coffeeflow_logged')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('PI-02.3 campos vacios invalidan el formulario y no se evalua la autenticacion', () => {
    componente.form.setValue({ usuario: '', password: '' });

    componente.ingresar();

    expect(componente.form.invalid).toBe(true);
    expect(componente.form.controls.usuario.touched).toBe(true);
    expect(componente.error).toBe('');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('PI-02.4 el campo contraseña se renderiza oculto (type=password) (RNF-06)', () => {
    const campo = fixture.nativeElement.querySelector('#password') as HTMLInputElement;

    expect(campo.type).toBe('password');
  });
});
