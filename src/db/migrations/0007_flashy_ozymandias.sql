CREATE TABLE "google_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agencia_id" uuid NOT NULL,
	"perfil_id" uuid NOT NULL,
	"email" text,
	"refresh_token" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "google_tokens" ADD CONSTRAINT "google_tokens_agencia_id_agencias_id_fk" FOREIGN KEY ("agencia_id") REFERENCES "public"."agencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_tokens" ADD CONSTRAINT "google_tokens_perfil_id_perfiles_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfiles"("id") ON DELETE no action ON UPDATE no action;