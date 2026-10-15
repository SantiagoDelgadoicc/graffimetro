CREATE TYPE "public"."proveedor_ia" AS ENUM('groq', 'gemini');--> statement-breakpoint
CREATE TYPE "public"."tipo_muro" AS ENUM('cerrado', 'abierto');--> statement-breakpoint
CREATE TABLE "lotes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lotes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"texto" text NOT NULL,
	"nombre_corto" text NOT NULL,
	"tipo" "tipo_muro" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ofertas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ofertas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"partida_id" uuid NOT NULL,
	"lote_id" integer NOT NULL,
	"texto_escrito" text,
	"palabra_normalizada" text,
	"tasacion_id" integer,
	"es_reintento" boolean DEFAULT false NOT NULL,
	"nota" smallint,
	"combo" smallint,
	"seguidores" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ofertas_nota_rango" CHECK ("ofertas"."nota" is null or "ofertas"."nota" between 0 and 100),
	CONSTRAINT "ofertas_combo_rango" CHECK ("ofertas"."combo" is null or "ofertas"."combo" between 1 and 7),
	CONSTRAINT "ofertas_seguidores_positivos" CHECK ("ofertas"."seguidores" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tasaciones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasaciones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lote_id" integer NOT NULL,
	"palabra_normalizada" text NOT NULL,
	"valida" boolean NOT NULL,
	"forma_canonica" text,
	"rareza_ia" smallint NOT NULL,
	"ingenio_ia" smallint NOT NULL,
	"comentario" text NOT NULL,
	"proveedor" "proveedor_ia" NOT NULL,
	"modelo" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasaciones_rareza_rango" CHECK ("tasaciones"."rareza_ia" between 0 and 100),
	CONSTRAINT "tasaciones_ingenio_rango" CHECK ("tasaciones"."ingenio_ia" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_lote_id_lotes_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_tasacion_id_tasaciones_id_fk" FOREIGN KEY ("tasacion_id") REFERENCES "public"."tasaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasaciones" ADD CONSTRAINT "tasaciones_lote_id_lotes_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lotes_texto_unico" ON "lotes" USING btree ("texto");--> statement-breakpoint
CREATE INDEX "ofertas_partida_idx" ON "ofertas" USING btree ("partida_id");--> statement-breakpoint
CREATE INDEX "ofertas_lote_idx" ON "ofertas" USING btree ("lote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasaciones_lote_palabra_unico" ON "tasaciones" USING btree ("lote_id","palabra_normalizada");--> statement-breakpoint
CREATE INDEX "tasaciones_lote_canonica_idx" ON "tasaciones" USING btree ("lote_id","forma_canonica");