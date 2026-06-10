CREATE TYPE "public"."plataforma_red" AS ENUM('facebook', 'instagram', 'tiktok', 'youtube', 'otro');--> statement-breakpoint
CREATE TABLE "cuentas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"plataforma" "plataforma_red" NOT NULL,
	"usuario" text NOT NULL,
	"url" text,
	"notas" text,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;