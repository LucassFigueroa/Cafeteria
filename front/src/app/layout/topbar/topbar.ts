import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-topbar',

  standalone: true,

  imports: [],

  templateUrl: './topbar.html',

  styleUrl: './topbar.scss'
})
export class Topbar {

  readonly fechaHoy =
    new Intl.DateTimeFormat(
      'es-CL',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    ).format(
      new Date()
    );
}