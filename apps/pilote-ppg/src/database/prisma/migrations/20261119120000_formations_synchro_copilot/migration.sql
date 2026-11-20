-- Les colonnes suivent la convention created_at, updated_at, deleted_at.
ALTER TABLE "formation_motif" RENAME COLUMN "date_suppression" TO "deleted_at";
ALTER TABLE "formation_seance" RENAME COLUMN "date_annulation" TO "cancelled_at";

-- Le lieu est laissé de côté (2026-11-19), à reprendre si le besoin apparaît.
ALTER TABLE "formation_seance" DROP COLUMN "lieu";

-- Animateurs en tableau. Les valeurs existantes ne viennent que du seed local.
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" TYPE TEXT[]
  USING CASE WHEN "animateurs" IS NULL THEN ARRAY[]::TEXT[] ELSE string_to_array("animateurs", ', ') END;
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" SET NOT NULL;
