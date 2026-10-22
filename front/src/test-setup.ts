// Node 22+ expone un localStorage experimental que reemplaza al de jsdom y no funciona sin
// --localstorage-file. Las pruebas usan un Storage en memoria con la misma API del navegador.
class MemoryStorage implements Storage {
  private datos = new Map<string, string>();

  get length(): number {
    return this.datos.size;
  }

  clear(): void {
    this.datos.clear();
  }

  getItem(clave: string): string | null {
    return this.datos.has(clave) ? (this.datos.get(clave) as string) : null;
  }

  key(indice: number): string | null {
    return Array.from(this.datos.keys())[indice] ?? null;
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, String(valor));
  }
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
