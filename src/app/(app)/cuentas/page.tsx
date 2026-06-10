import { requireUsuario } from '@/lib/dal'
import { Placeholder } from '@/components/Placeholder'

export default async function CuentasPage() {
  await requireUsuario()
  return (
    <Placeholder
      titulo="Cuentas"
      descripcion="Las cuentas de redes (Facebook, Instagram, TikTok…) de cada organización."
      items={[
        'Registrar las cuentas de redes por organización',
        'La jefa ve todas; el staff solo las de sus organizaciones asignadas',
        'Enlaces rápidos y datos de cada cuenta',
      ]}
    />
  )
}
