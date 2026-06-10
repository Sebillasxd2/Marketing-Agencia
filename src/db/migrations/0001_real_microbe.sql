CREATE TYPE "public"."estado_contrato" AS ENUM('activo', 'pausado', 'finalizado');--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "rubro" text;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "contacto" text;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "telefono" text;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "inicio_contrato" date;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "tarifa_mensual" numeric;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "estado_contrato" "estado_contrato" DEFAULT 'activo' NOT NULL;