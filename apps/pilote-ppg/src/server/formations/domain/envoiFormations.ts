export interface ErreurEnvoi {
  chemin: string;
  message: string;
}

interface Envoi {
  motifs: { id: number }[];
  seances: { id: number; motif_id: number }[];
}

// Règles de l'envoi de copilot, vérifiées avant toute écriture : sans elles, un
// doublon ou un motif absent finirait en violation de clé.
export function verifierEnvoi({ motifs, seances }: Envoi): ErreurEnvoi[] {
  // Une liste vide viendrait d'une panne de RDV-SP ou de copilot : elle retirerait
  // toutes les formations.
  if (motifs.length === 0) {
    return [{ chemin: "motifs", message: "Au moins un motif est attendu." }];
  }

  const erreurs: ErreurEnvoi[] = [];

  const motifsVus = new Set<number>();
  motifs.forEach((motif, index) => {
    if (motifsVus.has(motif.id)) {
      erreurs.push({
        chemin: `motifs.${index}.id`,
        message: `Le motif ${motif.id} apparaît plusieurs fois.`,
      });
    }
    motifsVus.add(motif.id);
  });

  const seancesVues = new Set<number>();
  seances.forEach((seance, index) => {
    if (seancesVues.has(seance.id)) {
      erreurs.push({
        chemin: `seances.${index}.id`,
        message: `La séance ${seance.id} apparaît plusieurs fois.`,
      });
    }
    seancesVues.add(seance.id);
  });

  seances.forEach((seance, index) => {
    if (!motifsVus.has(seance.motif_id)) {
      erreurs.push({
        chemin: `seances.${index}.motif_id`,
        message: `Le motif ${seance.motif_id} ne fait pas partie de l'envoi.`,
      });
    }
  });

  return erreurs;
}
