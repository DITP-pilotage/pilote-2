import {
  libellesMeteos,
  meteosSaisissables,
  type MeteoSaisissable,
} from "@/shared/meteo/Meteo.interface";
import type { $Enums } from "@prisma/client";
import type { TypeContenuChantier } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import { determineMaille } from "@/shared/maille/determineMaille";
import type { Maille } from "@/shared/maille/Maille.interface";
import type { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";

/**
 * Les outils de l'assistant renvoient des libellés, pas des codes (PIL-1900,
 * D1) : le modèle restitue ce qu'il lit, sans table de correspondance dans le
 * prompt. Ces traductions vivent ici, et non dans les queries partagées :
 * `GetChantiersQuery` sert aussi le tRPC.
 */

export function libelleNiveauDeConfiance({
  meteo,
}: {
  meteo: string | null;
}): string | null {
  return meteo === null ? null : (libellesMeteos[meteo] ?? null);
}

/**
 * L'inverse, pour le sous-agent du dashboard qui attend encore des codes.
 * Seuls les quatre niveaux saisissables ont un code.
 */
export function codeMeteoDepuisLibelle({
  libelle,
}: {
  libelle: string;
}): MeteoSaisissable | null {
  return (
    meteosSaisissables.find((meteo) => libellesMeteos[meteo] === libelle) ??
    null
  );
}

const LIBELLES_TENDANCE: Record<string, string> = {
  HAUSSE: "En hausse",
  BAISSE: "En baisse",
  STAGNATION: "Stable",
};

export function libelleTendance({
  tendance,
}: {
  tendance: string | null;
}): string | null {
  return tendance === null ? null : (LIBELLES_TENDANCE[tendance] ?? null);
}

const MAILLES_DE_LA_PLUS_FINE = [
  { code: "DEPT", libelle: "départementale" },
  { code: "REG", libelle: "régionale" },
  { code: "NAT", libelle: "nationale" },
] as const;

/** La maille la plus fine jusqu'à laquelle le chantier est piloté. */
export function mailleDePilotage({
  mailles,
}: {
  mailles: string[];
}): "nationale" | "régionale" | "départementale" | null {
  return (
    MAILLES_DE_LA_PLUS_FINE.find((maille) => mailles.includes(maille.code))
      ?.libelle ?? null
  );
}

export function libelleMaille({
  maille,
}: {
  maille: $Enums.Maille;
}): (typeof MAILLES_DE_LA_PLUS_FINE)[number]["libelle"] {
  const correspondance = MAILLES_DE_LA_PLUS_FINE.find(
    ({ code }) => code === maille,
  );
  if (!correspondance) {
    throw new Error(`Maille inconnue : ${maille}`);
  }
  return correspondance.libelle;
}

const LIBELLES_CATEGORIE_SIGNALEMENT: Record<TypeAlerteChantier, string> = {
  estEnAlerteÉcart: "Retard par rapport à la médiane",
  estEnAlerteBaisse: "Tendance en baisse",
  estEnAlerteTauxAvancementNonCalculé: "Taux d'avancement non calculé",
  estEnAlerteAbscenceTauxAvancementDepartemental:
    "Absence de taux d'avancement départemental",
  estEnAlerteMétéoNonRenseignée: "Météo et synthèse non renseignées",
  estEnAlertePossedePropositionsValeurAvancement:
    "Proposition de valeur d'avancement",
};

export function libelleCategorieSignalement({
  categorie,
}: {
  categorie: TypeAlerteChantier;
}): string {
  return LIBELLES_CATEGORIE_SIGNALEMENT[categorie];
}

const DESIGNATIONS_MAILLE: Record<Maille, string> = {
  nationale: "national",
  regionale: "région",
  departementale: "département",
};

/** La maille d'un territoire, telle qu'un texte la nomme : « la région », « le département ». */
export function designationMaille({
  territoireCode,
}: {
  territoireCode: string;
}): string {
  return DESIGNATIONS_MAILLE[determineMaille(territoireCode)];
}

const LIBELLES_TYPES_COMMENTAIRE: Record<TypeContenuChantier, string> = {
  freins_a_lever: "Freins à lever",
  actions_a_venir: "Actions à venir",
  actions_a_valoriser: "Actions à valoriser",
  autres_resultats_obtenus_non_correles_aux_indicateurs:
    "Autres résultats obtenus non corrélés aux indicateurs",
  decision_strategique: "Décisions stratégiques",
  commentaires_sur_les_donnees: "Commentaires sur les données",
  autres_resultats_obtenus: "Autres résultats obtenus",
  synthese_des_resultats: "Synthèse des résultats",
};

export function libelleTypeCommentaire({
  type,
}: {
  type: TypeContenuChantier;
}): string {
  return LIBELLES_TYPES_COMMENTAIRE[type];
}

const LIBELLE_MASQUE = "non accessible (restriction d'accès)";

/**
 * Une valeur telle qu'un sous-agent la recopie : son libellé, ou ce qui en
 * tient lieu. Une valeur absente s'écrit (le sous-agent laissait
 * « Tendance : » vide), et une valeur masquée par une restriction d'accès
 * n'est pas une valeur absente.
 */
export function libelleOuAbsence<Valeur>({
  valeur,
  absence,
  libelle = String,
  masquee = false,
}: {
  valeur: Valeur | null;
  /** Ce qui s'écrit à la place d'une valeur absente, accordé : « non renseignée ». */
  absence: string;
  libelle?: (valeur: Valeur) => string;
  masquee?: boolean;
}): string {
  if (masquee) return LIBELLE_MASQUE;
  if (valeur === null) return absence;
  return libelle(valeur);
}

/** Un nombre et ce qu'il compte, accordé : « 1 indicateur », « 3 indicateurs », « aucun indicateur ». */
export function compter({
  nombre,
  singulier,
  pluriel,
}: {
  nombre: number;
  singulier: string;
  pluriel: string;
}): string {
  if (nombre === 0) return `aucun ${singulier}`;
  return `${nombre} ${nombre === 1 ? singulier : pluriel}`;
}

/** Une énumération en français : « a », « a et b », « a, b et c ». */
export function enumerer({ elements }: { elements: string[] }): string {
  if (elements.length <= 1) return elements.join("");
  return `${elements.slice(0, -1).join(", ")} et ${elements.at(-1)}`;
}
