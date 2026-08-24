export function formatoCLP(valor: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(valor);
}

export function formatoFecha(fecha: string): string {
  const date = new Date(fecha);

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatoHora(fecha: string): string {
  const date = new Date(fecha);

  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}