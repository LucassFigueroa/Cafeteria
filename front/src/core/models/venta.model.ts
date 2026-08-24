export interface VentaItem {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  items: VentaItem[];
}

export interface VentaRequestItem {
  productoId: number;
  cantidad: number;
}