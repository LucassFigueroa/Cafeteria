import {
  Component,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-sidebar',

  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './sidebar.html',

  styleUrl: './sidebar.scss'
})
export class Sidebar {

  private readonly router =
    inject(Router);

  cerrarSesion(): void {

    localStorage.removeItem(
      'coffeeflow_logged'
    );

    this.router.navigate([
      '/login'
    ]);
  }
}