import {
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router
} from '@angular/router';

@Component({
  selector: 'app-login',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl: './login.html',

  styleUrl: './login.scss'
})
export class Login {

  private readonly fb =
    inject(FormBuilder);

  private readonly router =
    inject(Router);

  error = '';

  form =
    this.fb.nonNullable.group({

      usuario: [
        'admin',
        Validators.required
      ],

      password: [
        '1234',
        Validators.required
      ]

    });

  ingresar(): void {

    this.error = '';

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    const datos =
      this.form.getRawValue();

    if (
      datos.usuario === 'admin' &&
      datos.password === '1234'
    ) {

      localStorage.setItem(
        'coffeeflow_logged',
        'true'
      );

      this.router.navigate([
        '/dashboard'
      ]);

      return;
    }

    this.error =
      'Usuario o contraseña incorrectos.';
  }
}