import { ContenuRapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";

export const genererParametresRapportResponsableDonnees = (
  chantierInfo: { id: string; nom: string },
  indicateurs: { id: string; nom: string; mailles: string[] }[],
): ContenuRapportResponsableDonnees => {
  const nombreIndicateurs = indicateurs.length;

  return {
    chantiers: [
      {
        nom_chantier: chantierInfo.nom,
        id_chantier: chantierInfo.id,
        indicateursNonMisAJour: indicateurs,
        nombreIndicateursNonMisAJour:
          nombreIndicateurs > 1
            ? `${nombreIndicateurs} indicateurs à mettre à jour`
            : `${nombreIndicateurs} indicateur à mettre à jour`,
      },
    ],
  };
};
