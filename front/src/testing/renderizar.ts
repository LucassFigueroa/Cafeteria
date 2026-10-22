import { ComponentFixture } from '@angular/core/testing';

/**
 * Los componentes guardan su estado en propiedades simples (no signals). En modo zoneless la
 * vista solo se refresca si esta marcada, por eso se marca antes de ejecutar la deteccion.
 */
export function renderizar<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.changeDetectorRef.markForCheck();
  fixture.detectChanges();
}
