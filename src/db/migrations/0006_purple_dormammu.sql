ALTER TABLE "clientes" ADD COLUMN "token_aprobacion" uuid;--> statement-breakpoint
ALTER TABLE "piezas" ADD COLUMN "aprobada_cliente" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "piezas" ADD COLUMN "comentario_cliente" text;