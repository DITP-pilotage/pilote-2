import type { $Enums } from "@prisma/client";
import { libelleMaille } from "@/server/albert/tools/libelles";
import type { LigneIndicateurNonAJour } from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type { LigneIndicateurSansViVc } from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";

export type Motif = "va" | "vi" | "vc";
export type LibelleMotif = "VA non à jour" | "VI manquante" | "VC manquante";
export type LibelleMaille = ReturnType<typeof libelleMaille>;

export const MOTIFS_ORDER: Motif[] = ["va", "vi", "vc"];

export const LIBELLES_MOTIF: Record<Motif, LibelleMotif> = {
  va: "VA non à jour",
  vi: "VI manquante",
  vc: "VC manquante",
};

export type LigneFusionnee = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  maille: $Enums.Maille;
  territoireCode: string;
  territoireNom: string | null;
  territoireNomAffiche: string;
  motifs: Set<Motif>;
  va?: LigneIndicateurNonAJour;
  viVc?: LigneIndicateurSansViVc;
};

export type LigneACompleter = {
  chantier_id: string;
  chantier_nom: string;
  indicateur_id: string;
  indicateur_nom: string;
  territoire_code: string;
  territoire_nom: string | null;
  territoire_nom_affiche: string;
  maille: $Enums.Maille;
  motifs: LibelleMotif[];
  date_derniere_valeur?: string | null;
  mise_a_jour_attendue_depuis?: string | null;
  derniere_vc_connue?: { valeur: number; jalon: number } | null;
};

const comparer = (gauche: string, droite: string) =>
  gauche < droite ? -1 : gauche > droite ? 1 : 0;

export function fusionnerLignes({
  motifs,
  lignesVa,
  lignesViVc,
}: {
  motifs: Motif[];
  lignesVa: LigneIndicateurNonAJour[];
  lignesViVc: LigneIndicateurSansViVc[];
}): LigneFusionnee[] {
  const fusionnees = new Map<string, LigneFusionnee>();
  const obtenir = (
    ligne: LigneIndicateurNonAJour | LigneIndicateurSansViVc,
  ): LigneFusionnee => {
    const cle = `${ligne.indicateurId}|${ligne.territoireCode}`;
    const existante = fusionnees.get(cle);
    if (existante) return existante;
    const creee: LigneFusionnee = {
      chantierId: ligne.chantierId,
      chantierNom: ligne.chantierNom,
      indicateurId: ligne.indicateurId,
      indicateurNom: ligne.indicateurNom,
      maille: ligne.maille,
      territoireCode: ligne.territoireCode,
      territoireNom: ligne.territoireNom,
      territoireNomAffiche: ligne.territoireNomAffiche,
      motifs: new Set(),
    };
    fusionnees.set(cle, creee);
    return creee;
  };

  if (motifs.includes("va")) {
    for (const ligne of lignesVa) {
      const fusionnee = obtenir(ligne);
      fusionnee.motifs.add("va");
      fusionnee.va = ligne;
    }
  }
  for (const ligne of lignesViVc) {
    const motifsDeLaLigne: Motif[] = [];
    if (motifs.includes("vi") && ligne.viManquante) motifsDeLaLigne.push("vi");
    if (motifs.includes("vc") && ligne.vcManquante) motifsDeLaLigne.push("vc");
    if (motifsDeLaLigne.length === 0) continue;
    const fusionnee = obtenir(ligne);
    for (const motif of motifsDeLaLigne) fusionnee.motifs.add(motif);
    fusionnee.viVc = ligne;
  }

  return [...fusionnees.values()].sort(
    (gauche, droite) =>
      comparer(gauche.chantierId, droite.chantierId) ||
      comparer(gauche.indicateurId, droite.indicateurId) ||
      comparer(gauche.territoireCode, droite.territoireCode),
  );
}

export function versLigneACompleter(ligne: LigneFusionnee): LigneACompleter {
  return {
    chantier_id: ligne.chantierId,
    chantier_nom: ligne.chantierNom,
    indicateur_id: ligne.indicateurId,
    indicateur_nom: ligne.indicateurNom,
    territoire_code: ligne.territoireCode,
    territoire_nom: ligne.territoireNom,
    territoire_nom_affiche: ligne.territoireNomAffiche,
    maille: ligne.maille,
    motifs: MOTIFS_ORDER.filter((motif) => ligne.motifs.has(motif)).map(
      (motif) => LIBELLES_MOTIF[motif],
    ),
    ...(ligne.motifs.has("va") && ligne.va
      ? {
          date_derniere_valeur: ligne.va.dateDerniereValeur,
          mise_a_jour_attendue_depuis: ligne.va.miseAJourAttendueDepuis,
        }
      : {}),
    ...(ligne.motifs.has("vc") && ligne.viVc
      ? { derniere_vc_connue: ligne.viVc.derniereVcConnue }
      : {}),
  };
}
