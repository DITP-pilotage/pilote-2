export const SEUIL_RETARD_ALERTE_JOURS = 21;
export const SEUIL_RETARD_CRITIQUE_JOURS = 60;

export type TonaliteRetard = "critique" | "alerte" | "faible" | "inconnu";

export const tonaliteRetard = (retardJours: number | null): TonaliteRetard => {
  if (retardJours === null) return "inconnu";
  if (retardJours >= SEUIL_RETARD_CRITIQUE_JOURS) return "critique";
  if (retardJours >= SEUIL_RETARD_ALERTE_JOURS) return "alerte";
  return "faible";
};

export const libelleRetard = (retardJours: number | null): string =>
  retardJours === null ? "—" : `${retardJours} j`;

export const CLASSES_TONALITE_RETARD: Record<
  TonaliteRetard,
  { pastille: string; barre: string }
> = {
  critique: { pastille: "bg-[#fff4f3] text-[#ce0500]", barre: "bg-[#ce0500]" },
  alerte: { pastille: "bg-[#fff4e6] text-[#b34000]", barre: "bg-[#fc5d00]" },
  faible: { pastille: "bg-[#fdf9ea] text-[#7a5500]", barre: "bg-[#c8aa39]" },
  inconnu: {
    pastille: "bg-dsfr-grey-925 text-dsfr-mention-grey",
    barre: "bg-dsfr-grey-625",
  },
};
