/** Metadatos visuales del semáforo y de los tipos de pieza. */
export const estadoMeta: Record<string, { label: string; clase: string; punto: string }> = {
  borrador: { label: 'Borrador', clase: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400' },
  en_revision: { label: 'En revisión', clase: 'bg-blue-100 text-blue-700', punto: 'bg-blue-500' },
  verde: { label: 'Aprobado', clase: 'bg-green-100 text-green-700', punto: 'bg-green-500' },
  amarillo: { label: 'Necesita ajustes', clase: 'bg-amber-100 text-amber-700', punto: 'bg-amber-500' },
  rojo: { label: 'No va', clase: 'bg-red-100 text-red-700', punto: 'bg-red-500' },
}

export const tipoLabel: Record<string, string> = {
  video: 'Video',
  imagen: 'Imagen',
  copy: 'Copy',
  guion: 'Guion',
}
