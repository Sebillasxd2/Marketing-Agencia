/**
 * Seed de demo — Vértice.
 * Crea usuarios en Supabase Auth (Alejandra jefa + Carla/Marco empleados) y puebla
 * la base con el cliente piloto "El Patio de la Abuela" en estados mixtos del semáforo.
 * Idempotente: borra los datos demo y los vuelve a crear.
 *
 * Correr: npm run db:seed
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import * as s from '../src/db/schema'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const dbUrl = process.env.DATABASE_URL!
if (!url || !serviceKey || !dbUrl) throw new Error('Faltan variables en .env.local')

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const sql = postgres(dbUrl, { prepare: false })
const db = drizzle(sql, { schema: s })

const PASS = 'vertice123'
const usuarios = [
  { email: 'alejandra@vertice.demo', nombre: 'Alejandra', rol: 'jefa' as const },
  { email: 'carla@vertice.demo', nombre: 'Carla Mendoza', rol: 'empleado' as const },
  { email: 'marco@vertice.demo', nombre: 'Marco Téllez', rol: 'empleado' as const },
]

async function main() {
  console.log('· Limpiando usuarios de auth demo…')
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  for (const u of list.users) {
    if (usuarios.some((x) => x.email === u.email)) await admin.auth.admin.deleteUser(u.id)
  }

  console.log('· Creando usuarios de auth…')
  const id: Record<string, string> = {}
  for (const u of usuarios) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: PASS,
      email_confirm: true,
      user_metadata: { nombre: u.nombre },
    })
    if (error) throw error
    id[u.email] = data.user.id
  }

  console.log('· Limpiando tablas…')
  await db.delete(s.piezasReporte)
  await db.delete(s.publicaciones)
  await db.delete(s.cuentas)
  await db.delete(s.notificaciones)
  await db.delete(s.respuestasChecklist)
  await db.delete(s.revisiones)
  await db.delete(s.versionesPieza)
  await db.delete(s.reportesDiarios)
  await db.delete(s.piezas)
  await db.delete(s.asignacionesCliente)
  await db.delete(s.checklists)
  await db.delete(s.clientes)
  await db.delete(s.miembrosAgencia)
  await db.delete(s.perfiles)
  await db.delete(s.agencias)

  console.log('· Insertando agencia, perfiles y cliente…')
  const [agencia] = await db.insert(s.agencias).values({ nombre: 'Agencia de Alejandra (demo)', plan: 'demo' }).returning()
  const aid = agencia.id
  const ale = id['alejandra@vertice.demo']
  const carla = id['carla@vertice.demo']
  const marco = id['marco@vertice.demo']

  await db.insert(s.perfiles).values(usuarios.map((u) => ({ id: id[u.email], nombreCompleto: u.nombre, email: u.email })))
  await db.insert(s.miembrosAgencia).values(usuarios.map((u) => ({ agenciaId: aid, perfilId: id[u.email], rol: u.rol })))

  const [cliente] = await db.insert(s.clientes).values({
    agenciaId: aid,
    nombre: 'El Patio de la Abuela',
    ciudad: 'Sucre',
    notasMarca: 'Tradicional, casero, chuquisaqueño, familiar. NO estética moderna/fusión. NO carne cruda visible.',
  }).returning()

  await db.insert(s.asignacionesCliente).values([
    { agenciaId: aid, clienteId: cliente.id, empleadoId: carla },
    { agenciaId: aid, clienteId: cliente.id, empleadoId: marco },
  ])

  console.log('· Insertando cuentas de redes…')
  await db.insert(s.cuentas).values([
    { agenciaId: aid, clienteId: cliente.id, plataforma: 'instagram', usuario: '@elpatiodelaabuela.sucre', url: 'https://instagram.com/elpatiodelaabuela.sucre' },
    { agenciaId: aid, clienteId: cliente.id, plataforma: 'facebook', usuario: 'El Patio de la Abuela', url: null },
    { agenciaId: aid, clienteId: cliente.id, plataforma: 'tiktok', usuario: '@elpatiodelaabuela', url: null },
  ])

  console.log('· Insertando publicaciones del calendario (mes actual)…')
  const ahora = new Date()
  const yy = ahora.getFullYear()
  const mmes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = (d: number) => `${yy}-${mmes}-${String(d).padStart(2, '0')}`
  await db.insert(s.publicaciones).values([
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(3), titulo: 'Reel salteñas — ritual de las 6 AM', red: 'instagram', estado: 'publicado', creadaPor: ale },
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(8), titulo: 'Carrusel menú Día de la Madre', red: 'facebook', estado: 'aprobado', creadaPor: carla, asignadoA: carla },
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(12), titulo: 'Foto parrilla + charango (sábado)', red: 'instagram', estado: 'produccion', creadaPor: marco, asignadoA: marco },
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(15), titulo: 'Video "8 años, 1 receta"', red: 'tiktok', estado: 'idea', creadaPor: ale },
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(20), titulo: 'Historia: "se acabaron las salteñas"', red: 'instagram', estado: 'idea', creadaPor: carla, asignadoA: carla },
    { agenciaId: aid, clienteId: cliente.id, fecha: dia(26), titulo: 'Post Día de la Madre (el día)', red: 'facebook', estado: 'idea', creadaPor: ale },
  ])

  console.log('· Insertando checklists (estándar de la casa)…')
  await db.insert(s.checklists).values([
    {
      agenciaId: aid, tipoPieza: 'video', nombre: 'Estándar video / Reel',
      itemsJson: [
        { texto: 'Hook claro en los primeros 3 segundos', obligatorio: true },
        { texto: 'Subtítulos quemados (legible sin sonido)', obligatorio: true },
        { texto: 'CTA en los últimos 3-4 segundos', obligatorio: true },
        { texto: 'Sin carne cruda visible', obligatorio: true },
        { texto: 'Sin estética moderna / fusión', obligatorio: true },
        { texto: 'Tag de ubicación: Sucre, Bolivia', obligatorio: false },
      ],
    },
    {
      agenciaId: aid, tipoPieza: 'guion', nombre: 'Estándar guion',
      itemsJson: [
        { texto: 'Estructura Hook / Desarrollo / CTA', obligatorio: true },
        { texto: 'Tono cálido, familiar, sucrense', obligatorio: true },
        { texto: 'Sin palabras prohibidas', obligatorio: true, palabrasProhibidas: ['fusión', 'fusion', 'gourmet', 'foodie', 'brunch'] },
      ],
    },
    {
      agenciaId: aid, tipoPieza: 'copy', nombre: 'Estándar copy Meta',
      itemsJson: [
        { texto: 'Headline ≤ 40 caracteres', obligatorio: true },
        { texto: 'Primary text sin truncar (~125 reco)', obligatorio: true },
        { texto: 'Sin palabras prohibidas', obligatorio: true, palabrasProhibidas: ['fusión', 'fusion', 'gourmet', 'foodie', 'brunch', 'smash burger', 'healthy bowl'] },
        { texto: 'CTA apunta a canal real (WhatsApp / Get Directions)', obligatorio: true },
      ],
    },
    {
      agenciaId: aid, tipoPieza: 'imagen', nombre: 'Estándar imagen',
      itemsJson: [
        { texto: 'Sin carne cruda visible', obligatorio: true },
        { texto: 'Sin estética moderna / fusión', obligatorio: true },
        { texto: 'Marca / precio legible si aplica', obligatorio: false },
      ],
    },
  ])

  console.log('· Insertando piezas en estados mixtos…')
  type Rev = { color: 'verde' | 'amarillo' | 'rojo'; comentario?: string; motivos?: string[]; version?: number }
  async function pieza(o: {
    titulo: string; tipo: 'video' | 'imagen' | 'copy' | 'guion'; estado: 'borrador' | 'en_revision' | 'verde' | 'amarillo' | 'rojo';
    autor: string; tipoContenido: 'texto' | 'enlace_drive'; texto?: string; enlace?: string; rev?: Rev;
  }) {
    const [p] = await db.insert(s.piezas).values({
      agenciaId: aid, clienteId: cliente.id, titulo: o.titulo, tipo: o.tipo, estado: o.estado, versionActual: 1, creadaPor: o.autor,
    }).returning()
    await db.insert(s.versionesPieza).values({
      agenciaId: aid, piezaId: p.id, numeroVersion: 1, tipoContenido: o.tipoContenido, textoContenido: o.texto, enlaceDrive: o.enlace, subidaPor: o.autor,
    })
    if (o.rev) {
      await db.insert(s.revisiones).values({
        agenciaId: aid, piezaId: p.id, versionRevisada: o.rev.version ?? 1, color: o.rev.color, comentario: o.rev.comentario, motivos: o.rev.motivos, revisadaPor: ale,
      })
    }
    return p
  }

  const copyVerde = await pieza({
    titulo: 'Copy Día de la Madre — emocional (A1)', tipo: 'copy', estado: 'verde', autor: carla, tipoContenido: 'texto',
    texto: 'Headline: Llévala donde la traten así\nEste Día de la Madre, llévala a un patio donde sirvan lo que ella siempre cocinó. Mondongo, fricasé, sopa de maní y postre tradicional. Reservas por WhatsApp — quedan pocas mesas.',
    rev: { color: 'verde', comentario: 'Aprobado al primer intento. Perfecto el tono.' },
  })
  await pieza({
    titulo: 'Copy Día de la Madre — permiso emocional (A5)', tipo: 'copy', estado: 'amarillo', autor: marco, tipoContenido: 'texto',
    texto: 'Headline: Mamá no quiere flores\nQuiere descansar de la cocina. Llévala al patio donde la atienden como en casa de su madre. Menú especial Día de la Madre Bs 65. Reserva por WhatsApp antes que se llene.',
    rev: { color: 'amarillo', comentario: 'Buen ángulo, pero el headline "Mamá no quiere flores" puede sonar negativo. Probá "Regálale descanso". Y agrega la fecha (26 de mayo) en el primary text.', motivos: ['copy'] },
  })
  await pieza({
    titulo: 'Guion salteñas — "El ritual de las 6 AM" (#4)', tipo: 'guion', estado: 'en_revision', autor: carla, tipoContenido: 'texto',
    texto: 'HOOK: "Esto pasa antes que despiertes 🥟". Desarrollo: amasado 5:55, relleno 6:30, armado 7:00, horno 8:30, salen 9:00. CTA: "200 al día. Se acaban a las 12. Sáb-Dom."',
  })
  await pieza({
    titulo: 'Guion marca — "8 años, 1 receta" (#11)', tipo: 'guion', estado: 'verde', autor: carla, tipoContenido: 'texto',
    texto: 'HOOK: foto sepia del patio 2018. Don Roberto: "Mi mamá cocinaba mondongo todos los domingos. Cuando se fue, abrí este lugar para que nadie pierda esa receta." CTA: Calle Bolívar 425 · Reserva por WhatsApp.',
    rev: { color: 'verde', comentario: 'Hermoso. Este es el guion estrella, prod alta.' },
  })
  await pieza({
    titulo: 'Imagen chorizo a la brasa (parrilla)', tipo: 'imagen', estado: 'rojo', autor: marco, tipoContenido: 'enlace_drive', enlace: 'https://drive.google.com/file/d/DEMO-chorizo',
    rev: { color: 'rojo', comentario: 'Se ve carne cruda en el corte — rompe la regla del brief de Don Roberto. Usar foto del chorizo ya cocido y emplatado.', motivos: ['rompe_regla_brief', 'marca'] },
  })
  const copyTuristas = await pieza({
    titulo: 'Copy turistas EN — "Where locals eat" (C1)', tipo: 'copy', estado: 'en_revision', autor: marco, tipoContenido: 'texto',
    texto: "Headline: Where Sucre locals eat\nSkip the tourist menus. This is the colonial courtyard where Sucre's families take their grandmothers on Sunday. Real chuquisaqueño cuisine, 3 blocks from Plaza 25 de Mayo.",
  })
  await pieza({
    titulo: 'Copy almuerzo ejecutivo (E1) — borrador', tipo: 'copy', estado: 'borrador', autor: carla, tipoContenido: 'texto',
    texto: 'Headline: Almuerzo ejecutivo Bs 35\nSopa, segundo, postre y refresco. En 45 minutos sales. Calle Bolívar 425, a 3 cuadras de la Plaza.',
  })

  // Pieza estrella: v1 amarillo → v2 verde (muestra el control de calidad funcionando)
  const [showcase] = await db.insert(s.piezas).values({
    agenciaId: aid, clienteId: cliente.id, titulo: 'Reel Día de la Madre — "Lo que tu mamá realmente quiere" (#1)',
    tipo: 'video', estado: 'verde', versionActual: 2, creadaPor: carla,
  }).returning()
  await db.insert(s.versionesPieza).values([
    { agenciaId: aid, piezaId: showcase.id, numeroVersion: 1, tipoContenido: 'enlace_drive', enlaceDrive: 'https://drive.google.com/file/d/DEMO-reel-v1', subidaPor: carla },
    { agenciaId: aid, piezaId: showcase.id, numeroVersion: 2, tipoContenido: 'enlace_drive', enlaceDrive: 'https://drive.google.com/file/d/DEMO-reel-v2', subidaPor: carla },
  ])
  await db.insert(s.revisiones).values([
    { agenciaId: aid, piezaId: showcase.id, versionRevisada: 1, color: 'amarillo', comentario: 'El hook no engancha en los primeros 3s y faltan subtítulos quemados. Arranca con el ramo de flores y el texto "¿Otra vez flores?".', motivos: ['encuadre', 'copy'], revisadaPor: ale },
    { agenciaId: aid, piezaId: showcase.id, versionRevisada: 2, color: 'verde', comentario: 'Ahora sí engancha. Aprobado.', revisadaPor: ale },
  ])

  console.log('· Insertando reporte diario…')
  const [rep] = await db.insert(s.reportesDiarios).values({
    agenciaId: aid, empleadoId: carla, fecha: '2026-06-10',
    queHice: 'Terminé 3 copies de Día de la Madre y corregí el Reel del hook (ya quedó aprobado en la v2). Subí el guion de los "8 años".',
    planManana: 'Grabar los Reels de salteñas el lunes (día de cierre) y armar el carrusel del menú especial.',
    estado: 'enviado', enviadoEn: new Date(), leidoPorJefa: false,
  }).returning()
  await db.insert(s.piezasReporte).values([
    { agenciaId: aid, reporteId: rep.id, piezaId: copyVerde.id },
    { agenciaId: aid, reporteId: rep.id, piezaId: showcase.id },
  ])
  // Marco intencionalmente SIN reporte hoy → el dashboard lo muestra como "pendiente".

  console.log('\n✅ Seed completo.')
  console.log(`   Agencia: ${agencia.nombre}`)
  console.log('   Usuarios (contraseña: ' + PASS + '):')
  usuarios.forEach((u) => console.log(`     - ${u.email} (${u.rol})`))
  console.log('   Cliente: El Patio de la Abuela · 8 piezas en estados mixtos · 1 reporte diario.')

  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  try { await sql.end() } catch {}
  process.exit(1)
})
