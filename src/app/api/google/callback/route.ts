import { type NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { google } from 'googleapis'
import { getUsuario } from '@/lib/dal'
import { oauthClient } from '@/lib/google'
import { db } from '@/db'
import { googleTokens } from '@/db/schema'

export async function GET(request: NextRequest) {
  const u = await getUsuario()
  if (!u) return NextResponse.redirect(new URL('/login', request.url))

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/contenido/importar?error=1', request.url))

  const oauth = oauthClient()
  try {
    const { tokens } = await oauth.getToken(code)
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/contenido/importar?reauth=1', request.url))
    }
    oauth.setCredentials(tokens)

    let email: string | null = null
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth })
      const info = await oauth2.userinfo.get()
      email = info.data.email ?? null
    } catch {}

    await db.delete(googleTokens).where(eq(googleTokens.perfilId, u.id))
    await db.insert(googleTokens).values({
      agenciaId: u.agenciaId,
      perfilId: u.id,
      email,
      refreshToken: tokens.refresh_token,
    })
  } catch {
    return NextResponse.redirect(new URL('/contenido/importar?error=1', request.url))
  }

  return NextResponse.redirect(new URL('/contenido/importar?ok=1', request.url))
}
