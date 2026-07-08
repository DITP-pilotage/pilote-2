CREATE TABLE "organisme" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nom" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "contact_utile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisme_id" UUID NOT NULL REFERENCES "organisme"("id") ON DELETE RESTRICT,
  "nom" TEXT NOT NULL,
  "description" TEXT,
  "telephone" TEXT,
  "email" TEXT,
  "url" TEXT,
  "adresse" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "panier_contact_utile" (
  "panier_id" UUID NOT NULL REFERENCES "panier"("id") ON DELETE CASCADE,
  "contact_utile_id" UUID NOT NULL REFERENCES "contact_utile"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("panier_id", "contact_utile_id")
);

CREATE INDEX "panier_contact_utile_panier_id_idx" ON "panier_contact_utile"("panier_id");
