import {
  libellesMeteos,
  meteosSaisissables,
  type MeteoSaisissable,
} from "@/shared/meteo/Meteo.interface";
import type { $Enums } from "@prisma/client";
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
