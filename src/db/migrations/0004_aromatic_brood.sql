CREATE TYPE "public"."estado_publicacion" AS ENUM('idea', 'produccion', 'aprobado', 'publicado');--> statement-breakpoint
CREATE TABLE "publicaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"titulo" text NOT NULL,
	"red" "plataforma_red",
	"estado" "estado_publicacion" DEFAULT 'idea' NOT NULL,
	"notas" text,
	"asignado_a" uuid,
	"creada_por" uuid NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_asignado_a_perfiles_id_fk" FOREIGN KEY ("asignado_a") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_creada_por_perfiles_id_fk" FOREIGN KEY ("creada_por") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;