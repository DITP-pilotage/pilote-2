import { FicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat";
import { presenterEnTerritoireContrat } from "@/server/fiche-territoriale/app/contrats/TerritoireContrat";
import { getContainer } from "@/server/dependances";
import { presenterEnTauxAvancementAnnuelTerritoireContrat } from "@/server/fiche-territoriale/app/contrats/TauxAvancementAnnuelTerritoireContrat";
import { presenterEnRépartitionsMétéosContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { presenterEnChantierFicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat";

export const ficheTerritorialeHandler = () => {
  const recupererFicheTerritoriale = async (
    territoireCode: string,
    jalon: number,
  ): Promise<FicheTerritorialeContrat> => {
    const territoire = presenterEnTerritoireContrat(
      await getContainer("legacy")
        .resolve("récupérerTerritoireParCodeUseCase")
        .run({ territoireCode: territoireCode as string }),
    );

    const avancementTerritoire = await getContainer("legacy")
      .resolve("récupérerTauxAvancementTerritoireUseCase")
      .run({ territoireCode, jalon })
      .then(presenterEnTauxAvancementAnnuelTerritoireContrat);

    const répartitionMétéos = await getContainer("legacy")
      .resolve("récupérerRépartitionMétéoUseCase")
      .run({ territoireCode, jalon })
      .then(presenterEnRépartitionsMétéosContrat);

    const chantiersFicheTerritoriale = await getContainer("legacy")
      .resolve("récupérerListeChantierFicheTerritorialeUseCase")
      .run({ territoireCode, jalon })
      .then((result) =>
        result.map(presenterEnChantierFicheTerritorialeContrat),
      );

    return {
      territoire,
      avancementTerritoire,
      répartitionMétéos,
      chantiersFicheTerritoriale,
      jalon,
    };
  };

  return {
    recupererFicheTerritoriale,
  };
};
