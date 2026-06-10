/**
 * Esquema de la base de datos — Plataforma de Agencia (v2)
 *
 * Multi-tenant desde el día 1: TODAS las tablas llevan `agencia_id`.
 * En el MVP la autorización es por rol en la app (Server Actions);
 * las políticas RLS de Postgres se activan en la fase SaaS sin cambiar el esquema.
 *
 * Regla load-bearing del producto: solo el rol 'jefa' transiciona el semáforo
 * (verde/amarillo/rojo). Eso se impone en la capa de aplicación.
 */
import {
  pgTable, pgEnum, uuid, text, boolean, integer, numeric, timestamp, date, jsonb,
} from 'drizzle-orm/pg-core'

// ── Enums ────────────────────────────────────────────────────────────────
export const rolUsuario = pgEnum('rol_usuario', ['jefa', 'empleado'])
export const planAgencia = pgEnum('plan_agencia', ['demo', 'pro'])
export const tipoPieza = pgEnum('tipo_pieza', ['video', 'imagen', 'copy', 'guion'])
export const estadoPieza = pgEnum('estado_pieza', [
  'borrador', 'en_revision', 'verde', 'amarillo', 'rojo',
])
export const tipoContenidoVersion = pgEnum('tipo_contenido_version', [
  'archivo', 'texto', 'enlace_drive',
])
export const colorRevision = pgEnum('color_revision', ['verde', 'amarillo', 'rojo'])
export const estadoReporte = pgEnum('estado_reporte', ['pendiente', 'enviado'])
export const estadoContrato = pgEnum('estado_contrato', ['activo', 'pausado', 'finalizado'])
export const tipoNotificacion = pgEnum('tipo_notificacion', [
  'pieza_en_revision', 'pieza_decidida', 'reporte_recordatorio', 'reporte_recibido',
])

// Forma de cada item de una checklist (estándar de la casa).
export type ChecklistItem = {
  texto: string
  obligatorio: boolean
  palabrasProhibidas?: string[]
}

// ── Tenant raíz ──────────────────────────────────────────────────────────
export const agencias = pgTable('agencias', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  logoUrl: text('logo_url'),
  plan: planAgencia('plan').notNull().default('demo'),
  creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
})

// Perfil de usuario. `id` = auth.users.id de Supabase (se sincroniza por trigger/app).
export const perfiles = pgTable('perfiles', {
  id: uuid('id').primaryKey(),
  nombreCompleto: text('nombre_completo').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
})

// Rol POR agencia (clave para SaaS: una persona podría ser jefa en su agencia).
export const miembrosAgencia = pgTable('miembros_agencia', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  perfilId: uuid('perfil_id').notNull().references(() => perfiles.id),
  rol: rolUsuario('rol').notNull(),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
})

// Negocio local del que la agencia maneja contenido.
export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  nombre: text('nombre').notNull(),
  rubro: text('rubro'),
  ciudad: text('ciudad'),
  contacto: text('contacto'),
  telefono: text('telefono'),
  inicioContrato: date('inicio_contrato'),
  tarifaMensual: numeric('tarifa_mensual'),
  estadoContrato: estadoContrato('estado_contrato').notNull().default('activo'),
  notasMarca: text('notas_marca'),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
})

// Qué empleado trabaja qué cliente (filtra la visibilidad del empleado).
export const asignacionesCliente = pgTable('asignaciones_cliente', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  clienteId: uuid('cliente_id').notNull().references(() => clientes.id),
  empleadoId: uuid('empleado_id').notNull().references(() => perfiles.id),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
})

// Entidad central. Máquina de estados:
// borrador → en_revision → verde | amarillo | rojo ; amarillo → (corrige, +1 versión) → en_revision.
// Solo 'verde' cuenta como entregado. No hay botón "listo" para el empleado.
export const piezas = pgTable('piezas', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  clienteId: uuid('cliente_id').notNull().references(() => clientes.id),
  titulo: text('titulo').notNull(),
  tipo: tipoPieza('tipo').notNull(),
  estado: estadoPieza('estado').notNull().default('borrador'),
  versionActual: integer('version_actual').notNull().default(1),
  creadaPor: uuid('creada_por').notNull().references(() => perfiles.id),
  creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadaEn: timestamp('actualizada_en', { withTimezone: true }).notNull().defaultNow(),
})

// Cada subida es un SNAPSHOT INMUTABLE (mitiga el bug #1 del rubro: comentar v1
// mientras producción va en v3). El estado y los comentarios pertenecen a la versión.
export const versionesPieza = pgTable('versiones_pieza', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  piezaId: uuid('pieza_id').notNull().references(() => piezas.id),
  numeroVersion: integer('numero_version').notNull(),
  tipoContenido: tipoContenidoVersion('tipo_contenido').notNull(),
  archivoUrl: text('archivo_url'),
  miniaturaUrl: text('miniatura_url'),
  textoContenido: text('texto_contenido'),
  enlaceDrive: text('enlace_drive'),
  subidaPor: uuid('subida_por').notNull().references(() => perfiles.id),
  subidaEn: timestamp('subida_en', { withTimezone: true }).notNull().defaultNow(),
})

// AUDIT LOG del criterio de la jefa. Anclada a pieza + versión, no a un chat global.
// Validación en la app: amarillo EXIGE comentario; rojo EXIGE motivo; verde = un clic.
export const revisiones = pgTable('revisiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  piezaId: uuid('pieza_id').notNull().references(() => piezas.id),
  versionRevisada: integer('version_revisada').notNull(),
  color: colorRevision('color').notNull(),
  comentario: text('comentario'),
  motivos: text('motivos').array(),
  revisadaPor: uuid('revisada_por').notNull().references(() => perfiles.id),
  revisadaEn: timestamp('revisada_en', { withTimezone: true }).notNull().defaultNow(),
})

// Codifica el ESTÁNDAR de la casa por tipo de pieza. Editable solo por la jefa.
export const checklists = pgTable('checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  tipoPieza: tipoPieza('tipo_pieza').notNull(),
  nombre: text('nombre').notNull(),
  itemsJson: jsonb('items_json').$type<ChecklistItem[]>().notNull(),
  creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
})

// Estado de los checks de una pieza/versión. GATE: la pieza no pasa a en_revision
// hasta que todos los items obligatorios estén marcados (validado en el servidor).
export const respuestasChecklist = pgTable('respuestas_checklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  piezaId: uuid('pieza_id').notNull().references(() => piezas.id),
  version: integer('version').notNull(),
  itemIndex: integer('item_index').notNull(),
  marcado: boolean('marcado').notNull().default(false),
  marcadoPor: uuid('marcado_por').references(() => perfiles.id),
  marcadoEn: timestamp('marcado_en', { withTimezone: true }),
})

// Un reporte por empleado por día. NO lleva semáforo. 'Enviar' exige que_hice no vacío.
export const reportesDiarios = pgTable('reportes_diarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  empleadoId: uuid('empleado_id').notNull().references(() => perfiles.id),
  fecha: date('fecha').notNull(),
  queHice: text('que_hice').notNull(),
  bloqueos: text('bloqueos'),
  planManana: text('plan_manana'),
  dedicacionHoras: numeric('dedicacion_horas'),
  estado: estadoReporte('estado').notNull().default('pendiente'),
  enviadoEn: timestamp('enviado_en', { withTimezone: true }),
  respuestaJefa: text('respuesta_jefa'),
  leidoPorJefa: boolean('leido_por_jefa').notNull().default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
})

// Auto-vínculo reporte ↔ piezas trabajadas ese día (hace el dashboard "vivo").
export const piezasReporte = pgTable('piezas_reporte', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  reporteId: uuid('reporte_id').notNull().references(() => reportesDiarios.id),
  piezaId: uuid('pieza_id').notNull().references(() => piezas.id),
})

// Cierra el loop bidireccional in-app (sube → jefa avisada; decide → empleado avisado;
// recordatorio de reporte). Email/WhatsApp quedan para Fase 2.
export const notificaciones = pgTable('notificaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  agenciaId: uuid('agencia_id').notNull().references(() => agencias.id),
  destinatarioId: uuid('destinatario_id').notNull().references(() => perfiles.id),
  tipo: tipoNotificacion('tipo').notNull(),
  piezaId: uuid('pieza_id').references(() => piezas.id),
  mensaje: text('mensaje').notNull(),
  leida: boolean('leida').notNull().default(false),
  creadaEn: timestamp('creada_en', { withTimezone: true }).notNull().defaultNow(),
})

// ── Tipos inferidos (comodidad para la app) ──────────────────────────────
export type Agencia = typeof agencias.$inferSelect
export type Perfil = typeof perfiles.$inferSelect
export type Cliente = typeof clientes.$inferSelect
export type Pieza = typeof piezas.$inferSelect
export type NuevaPieza = typeof piezas.$inferInsert
export type VersionPieza = typeof versionesPieza.$inferSelect
export type Revision = typeof revisiones.$inferSelect
export type Checklist = typeof checklists.$inferSelect
export type ReporteDiario = typeof reportesDiarios.$inferSelect
export type Notificacion = typeof notificaciones.$inferSelect
