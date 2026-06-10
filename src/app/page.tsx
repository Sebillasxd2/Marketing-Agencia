import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/dal'

export default async function Home() {
  const u = await getUsuario()
  redirect(u ? (u.rol === 'jefa' ? '/jefa' : '/empleado') : '/login')
}
