import { type NextRequest, NextResponse } from 'next/server'
import { getUsuario } from '@/lib/dal'
import { authUrl } from '@/lib/google'

export async function GET(request: NextRequest) {
  const u = await getUsuario()
  if (!u) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.redirect(authUrl())
}
