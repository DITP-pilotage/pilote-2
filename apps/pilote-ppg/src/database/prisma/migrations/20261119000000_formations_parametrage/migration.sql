-- Une période d'information n'est jamais effacée : la supprimer renseigne cette date.
ALTER TABLE "formation_periode_information" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Le paramétrage ne référence que des motifs existants. RESTRICT : un motif utilisé ne
-- disparaît pas sans que le paramétrage le sache.
ALTER TABLE "formation_motif_profil" ADD CONSTRAINT "formation_motif_profil_motif_id_fkey" FOREIGN KEY ("motif_id") REFERENCES "formation_motif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "formation_periode_information_motif" ADD CONSTRAINT "formation_periode_information_motif_motif_id_fkey" FOREIGN KEY ("motif_id") REFERENCES "formation_motif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
