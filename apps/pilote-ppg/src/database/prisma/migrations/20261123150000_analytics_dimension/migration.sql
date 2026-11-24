CREATE TABLE "analytics_dimension" (
    "cle" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_dimension_pkey" PRIMARY KEY ("cle")
);

CREATE UNIQUE INDEX "analytics_dimension_slot_key" ON "analytics_dimension"("slot");

-- Reprise de NEXT_PUBLIC_MATOMO_DIMENSIONS : les numéros ne changent pas, pour la
-- continuité des rapports Matomo.
INSERT INTO "analytics_dimension" ("cle", "slot") VALUES
    ('profil_pilote', 1),
    ('conversation_id', 2),
    ('llm_call_id', 3),
    ('proposition_id', 4),
    ('proposition_mode', 5),
    ('type_question', 6),
    ('nombre_choix', 7),
    ('position_choix', 8),
    ('environnement', 9);
