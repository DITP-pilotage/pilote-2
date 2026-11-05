import { formaterDate } from "@/client/utils/date/date";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/getIndicateursACompleter";
import type {
  LigneACompleter,
  LibelleMotif,
} from "@/server/albert/tools/indicateursACompleter";

const VALEUR_ABSENTE = "—";

const dateFrancaise = (dateIso: string) =>
  formaterDate(dateIso, "DD/MM/YYYY") ?? dateIso;

/** Une ligne par indicateur × territoire × motif, pour filtrer et regrouper par motif. */
export type LigneDetail = Omit<LigneACompleter, "motifs"> & {
  motif: LibelleMotif;
};

export const lignesDetail = ({
  lignes,
}: Pick<DetailIndicateursACompleter, "lignes">): LigneDetail[] =>
  lignes.flatMap(({ motifs, ...ligne }) =>
    motifs.map((motif) => ({ ...ligne, motif })),
  );

export const libelleChantier = (ligne: LigneDetail) =>
  `${ligne.chantier_id} ${ligne.chantier_nom}`;

export const libelleIndicateur = (ligne: LigneDetail) =>
  `${ligne.indicateur_id} ${ligne.indicateur_nom}`;

export const libelleTerritoire = (ligne: LigneDetail) =>
  ligne.territoire_nom_affiche ?? ligne.territoire_nom ?? ligne.territoire_code;

export type ColonneDetail = {
  id: string;
  titre: string;
  /** Titre plus court dans l'en-tête du tableau, à la largeur limitée du chat. */
  titreCourt?: string;
  valeur: (ligne: LigneDetail) => string;
};

const COLONNES_VA: ColonneDetail[] = [
  {
    id: "derniere_va",
    titre: "Dernière VA",
    valeur: (ligne) =>
      ligne.motif === "VA non à jour"
        ? ligne.date_derniere_valeur
          ? dateFrancaise(ligne.date_derniere_valeur)
          : "jamais renseignée"
        : VALEUR_ABSENTE,
  },
  {
    id: "mise_a_jour_attendue_depuis",
    titre: "Mise à jour attendue depuis",
    titreCourt: "Attendue depuis",
    valeur: (ligne) =>
      ligne.motif === "VA non à jour"
        ? ligne.mise_a_jour_attendue_depuis
          ? dateFrancaise(ligne.mise_a_jour_attendue_depuis)
          : VALEUR_ABSENTE
        : VALEUR_ABSENTE,
  },
];

const COLONNES_VC: ColonneDetail[] = [
  {
    id: "derniere_vc_connue",
    titre: "Dernière VC connue",
    valeur: (ligne) =>
      ligne.motif === "VC manquante" && ligne.derniere_vc_connue
        ? `${ligne.derniere_vc_connue.valeur} (jalon ${ligne.derniere_vc_connue.jalon})`
        : VALEUR_ABSENTE,
  },
];

/** Les colonnes du détail, communes au tableau affiché et à son export CSV. */
export const colonnesDetail = ({
  motifs,
}: {
  motifs: DetailIndicateursACompleter["motifs"];
}): ColonneDetail[] => [
  { id: "chantier", titre: "Chantier", valeur: libelleChantier },
  { id: "indicateur", titre: "Indicateur", valeur: libelleIndicateur },
  { id: "territoire", titre: "Territoire", valeur: libelleTerritoire },
  { id: "motif", titre: "Motif", valeur: (ligne) => ligne.motif },
  ...(motifs.includes("va") ? COLONNES_VA : []),
  ...(motifs.includes("vc") ? COLONNES_VC : []),
];
