// ============================================================
// UTILIDADES — Funciones auxiliares reutilizables
// ============================================================

import { EstadoContrato } from '@/types';
import { MESES_POR_VENCER } from './constants';

/**
 * Muestra "Sin dato" cuando el valor es null, undefined o vacío.
 */
export function mostrarDato(valor: string | number | null | undefined, sufijo?: string): string {
  if (valor === null || valor === undefined || valor === '') return 'Sin dato';
  return sufijo ? `${valor} ${sufijo}` : String(valor);
}

/**
 * Formatea un número con separador de miles.
 * Ej: 1249 → "1,249"
 */
export function formatearNumero(n: number): string {
  return n.toLocaleString('es-PE');
}

/**
 * Formatea una fecha ISO a formato peruano dd/mm/yyyy.
 */
export function formatearFecha(fechaISO: string | null): string {
  if (!fechaISO) return 'Sin dato';
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return 'Sin dato';
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calcula la fecha de vencimiento sumando 5 años a la fecha de suscripción.
 */
export function calcularVencimiento(fechaSuscripcion: string | null): string | null {
  if (!fechaSuscripcion) return null;
  const fecha = new Date(fechaSuscripcion);
  if (isNaN(fecha.getTime())) return null;
  fecha.setFullYear(fecha.getFullYear() + 5);
  return fecha.toISOString().split('T')[0];
}

/**
 * Determina el estado del contrato basándose en la fecha de vencimiento.
 * - vigente: más de MESES_POR_VENCER meses restantes
 * - por_vencer: menos de MESES_POR_VENCER meses restantes
 * - vencido: ya pasó la fecha
 * - sin_dato: no tiene fecha
 */
export function calcularEstadoContrato(fechaVencimiento: string | null): EstadoContrato {
  if (!fechaVencimiento) return 'sin_dato';
  const vencimiento = new Date(fechaVencimiento);
  if (isNaN(vencimiento.getTime())) return 'sin_dato';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (vencimiento < hoy) return 'vencido';

  const diffMs = vencimiento.getTime() - hoy.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (diffDias <= 60) return 'por_vencer';
  return 'vigente';
}

/**
 * Calcula los meses restantes hasta una fecha.
 * Retorna null si la fecha es inválida.
 */
export function mesesRestantes(fechaVencimiento: string | null): number | null {
  if (!fechaVencimiento) return null;
  const vencimiento = new Date(fechaVencimiento);
  if (isNaN(vencimiento.getTime())) return null;

  const hoy = new Date();
  const diffMs = vencimiento.getTime() - hoy.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

/**
 * Normaliza texto: quita espacios extra, pone en mayúsculas y maneja tildes.
 * Útil para comparar nombres de catálogos.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Genera un slug para URLs amigables.
 * Ej: "San Isidro" → "san-isidro"
 */
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar diacríticos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Trunca un texto con "..." si excede el largo máximo.
 */
export function truncar(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength - 3) + '...';
}

/**
 * Genera un color de clase CSS según el estado del contrato.
 */
export function claseEstado(estado: EstadoContrato): string {
  const mapa: Record<EstadoContrato, string> = {
    vigente: 'statusVigente',
    por_vencer: 'statusPorVencer',
    vencido: 'statusVencido',
    sin_dato: 'statusSinDato',
  };
  return mapa[estado];
}

/**
 * Debounce: retrasa la ejecución de una función hasta que
 * el usuario deje de llamarla por X milisegundos.
 * Ideal para el buscador (no buscar en cada tecla).
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Agrupa un array de objetos por una propiedad.
 */
export function agruparPor<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const grupo = String(item[key] ?? 'Sin dato');
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Cuenta ocurrencias de cada valor de una propiedad.
 * Retorna un array ordenado de mayor a menor.
 */
export function contarPor<T>(items: T[], key: keyof T): { nombre: string; cantidad: number }[] {
  const conteo: Record<string, number> = {};
  items.forEach((item) => {
    const valor = String(item[key] ?? 'Sin dato');
    conteo[valor] = (conteo[valor] || 0) + 1;
  });
  return Object.entries(conteo)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
