import { $Enums } from "@prisma/client";
import { EvenementPourDateDernierImport } from "@/server/chantiers/domain/calculerDateDernierImport";

export interface LigneDernierImportParTerritoire {
  indic_id: string;
  territoire_code: string;
  type_evenement: $Enums.type_evenement;
  _max: { date_creation: Date | null };
}

export function regrouperDerniersImportsParIndicateur(
  lignes: LigneDernierImportParTerritoire[],
): Map<string, EvenementPourDateDernierImport[]> {
  const evenementsParIndicateur = new Map<
    string,
    EvenementPourDateDernierImport[]
  >();

  for (const ligne of lignes) {
    if (!ligne._max.date_creation) {
      continue;
    }

    const evenements = evenementsParIndicateur.get(ligne.indic_id) ?? [];
    evenements.push({
      territoire_code: ligne.territoire_code,
      type_evenement: ligne.type_evenement,
      date_creation: ligne._max.date_creation,
    });
    evenementsParIndicateur.set(ligne.indic_id, evenements);
  }

  return evenementsParIndicateur;
}
