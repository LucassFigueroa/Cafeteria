import { formatoCLP, formatoFecha, formatoHora } from './formato';

/**
 * PU-01 - Utilidades de formato (RNF-11 Localizacion es-CL).
 */
describe('PU-01 formato (localizacion es-CL)', () => {

  it('PU-01.1 formatoCLP usa separador de miles y no muestra decimales', () => {
    expect(formatoCLP(16100)).toBe('$16.100');
    expect(formatoCLP(2500)).toBe('$2.500');
    expect(formatoCLP(1234567)).toBe('$1.234.567');
  });

  it('PU-01.2 formatoCLP redondea montos con decimales (CLP no usa centavos)', () => {
    expect(formatoCLP(1999.6)).toBe('$2.000');
  });

  it('PU-01.3 formatoCLP con valor limite 0', () => {
    expect(formatoCLP(0)).toBe('$0');
  });

  it('PU-01.4 formatoFecha devuelve dd-mm-aaaa', () => {
    expect(formatoFecha('2026-09-09T11:20:00')).toBe('09-09-2026');
    expect(formatoFecha('2026-12-31T23:59:59')).toBe('31-12-2026');
  });

  it('PU-01.5 formatoHora devuelve HH:mm en formato 24 horas', () => {
    expect(formatoHora('2026-09-09T11:20:00')).toBe('11:20');
    expect(formatoHora('2026-09-09T18:05:00')).toBe('18:05');
  });
});
