CREATE TYPE "public"."color_revision" AS ENUM('verde', 'amarillo', 'rojo');--> statement-breakpoint
CREATE TYPE "public"."estado_pieza" AS ENUM('borrador', 'en_revision', 'verde', 'amarillo', 'rojo');--> statement-breakpoint
CREATE TYPE "public"."estado_reporte" AS ENUM('pendiente', 'enviado');--> statement-breakpoint
CREATE TYPE "public"."plan_agencia" AS ENUM('demo', 'pro');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('jefa', 'empleado');--> statement-breakpoint
CREATE TYPE "public"."tipo_contenido_version" AS ENUM('archivo', 'texto', 'enlace_drive');--> statement-breakpoint
CREATE TYPE "public"."tipo_notificacion" AS ENUM('pieza_en_revision', 'pieza_decidida', 'reporte_recordatorio', 'reporte_recibido');--> statement-breakpoint
CREATE TYPE "public"."tipo_pieza" AS ENUM('video', 'imagen', 'copy', 'guion');--> statement-breakpoint
CREATE TABLE "agencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"logo_url" text,
	"plan" "plan_agencia" DEFAULT 'demo' NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asignaciones_cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"empleado_id" uuid NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"tipo_pieza" "tipo_pieza" NOT NULL,
	"nombre" text NOT NULL,
	"items_json" jsonb NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"ciudad" text,
	"notas_marca" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "miembros_agencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"perfil_id" uuid NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"destinatario_id" uuid NOT NULL,
	"tipo" "tipo_notificacion" NOT NULL,
	"pieza_id" uuid,
	"mensaje" text NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre_completo" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piezas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"tipo" "tipo_pieza" NOT NULL,
	"estado" "estado_pieza" DEFAULT 'borrador' NOT NULL,
	"version_actual" integer DEFAULT 1 NOT NULL,
	"creada_por" uuid NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "piezas_reporte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"reporte_id" uuid NOT NULL,
	"pieza_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportes_diarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"empleado_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"que_hice" text NOT NULL,
	"bloqueos" text,
	"plan_manana" text,
	"dedicacion_horas" numeric,
	"estado" "estado_reporte" DEFAULT 'pendiente' NOT NULL,
	"enviado_en" timestamp with time zone,
	"respuesta_jefa" text,
	"leido_por_jefa" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respuestas_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"pieza_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"item_index" integer NOT NULL,
	"marcado" boolean DEFAULT false NOT NULL,
	"marcado_por" uuid,
	"marcado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "revisiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"pieza_id" uuid NOT NULL,
	"version_revisada" integer NOT NULL,
	"color" "color_revision" NOT NULL,
	"comentario" text,
	"motivos" text[],
	"revisada_por" uuid NOT NULL,
	"revisada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "versiones_pieza" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"pieza_id" uuid NOT NULL,
	"numero_version" integer NOT NULL,
	"tipo_contenido" "tipo_contenido_version" NOT NULL,
	"archivo_url" text,
	"miniatura_url" text,
	"texto_contenido" text,
	"enlace_drive" text,
	"subida_por" uuid NOT NULL,
	"subida_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asignaciones_cliente" ADD CONSTRAINT "asignaciones_cliente_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_cliente" ADD CONSTRAINT "asignaciones_cliente_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaciones_cliente" ADD CONSTRAINT "asignaciones_cliente_empleado_id_perfiles_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "miembros_agencia" ADD CONSTRAINT "miembros_agencia_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "miembros_agencia" ADD CONSTRAINT "miembros_agencia_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_destinatario_id_perfiles_id_fk" FOREIGN KEY ("destinatario_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_pieza_id_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."piezas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas" ADD CONSTRAINT "piezas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas" ADD CONSTRAINT "piezas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas" ADD CONSTRAINT "piezas_creada_por_perfiles_id_fk" FOREIGN KEY ("creada_por") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas_reporte" ADD CONSTRAINT "piezas_reporte_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas_reporte" ADD CONSTRAINT "piezas_reporte_reporte_id_reportes_diarios_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes_diarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "piezas_reporte" ADD CONSTRAINT "piezas_reporte_pieza_id_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."piezas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_diarios" ADD CONSTRAINT "reportes_diarios_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_diarios" ADD CONSTRAINT "reportes_diarios_empleado_id_perfiles_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_checklist" ADD CONSTRAINT "respuestas_checklist_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_checklist" ADD CONSTRAINT "respuestas_checklist_pieza_id_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."piezas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_checklist" ADD CONSTRAINT "respuestas_checklist_marcado_por_perfiles_id_fk" FOREIGN KEY ("marcado_por") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_pieza_id_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."piezas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_revisada_por_perfiles_id_fk" FOREIGN KEY ("revisada_por") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_pieza" ADD CONSTRAINT "versiones_pieza_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_pieza" ADD CONSTRAINT "versiones_pieza_pieza_id_piezas_id_fk" FOREIGN KEY ("pieza_id") REFERENCES "public"."piezas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versiones_pieza" ADD CONSTRAINT "versiones_pieza_subida_por_perfiles_id_fk" FOREIGN KEY ("subida_por") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;