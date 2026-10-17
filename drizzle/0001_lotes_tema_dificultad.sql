CREATE TYPE "public"."dificultad_lote" AS ENUM('facil', 'medio', 'dificil');--> statement-breakpoint
CREATE TYPE "public"."tema_lote" AS ENUM('vida-cotidiana', 'urbano-y2k', 'naturaleza-ciencia', 'pop-ocio');--> statement-breakpoint
ALTER TABLE "lotes" ADD COLUMN "numero" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "lotes" ADD COLUMN "tema" "tema_lote" NOT NULL;--> statement-breakpoint
ALTER TABLE "lotes" ADD COLUMN "dificultad" "dificultad_lote" NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "lotes_numero_unico" ON "lotes" USING btree ("numero");