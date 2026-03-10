import { FicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/FicheTerritorialeContrat";
import { presenterEnTerritoireContrat } from "@/server/fiche-territoriale/app/contrats/TerritoireContrat";
import { RécupérerTerritoireParCodeUseCase } from "@/server/fiche-territoriale/usecases/RécupérerTerritoireParCodeUseCase";
import { getContainer } from "@/server/dependances";
import { presenterEnTauxAvancementAnnuelTerritoireContrat } from "@/server/fiche-territoriale/app/contrats/TauxAvancementAnnuelTerritoireContrat";
import { RécupérerTauxAvancementTerritoireUseCase } from "@/server/fiche-territoriale/usecases/RécupérerTauxAvancementTerritoireUseCase";
import { presenterEnRépartitionsMétéosContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { RécupérerRépartitionMétéoUseCase } from "@/server/fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase";
import { RécupérerListeChantierFicheTerritorialeUseCase } from "@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase";
import { presenterEnChantierFicheTerritorialeContrat } from "@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat";

export const ficheTerritorialeHandler = () => {
  const recupererFicheTerritoriale = async (
    territoireCode: string,
    jalon: number,
  ): Promise<FicheTerritorialeContrat> => {
    const territoire = presenterEnTerritoireContrat(
      await new RécupérerTerritoireParCodeUseCase({
        territoireRepository: getContainer("legacy").resolve(
          "ficheTerritorialeTerritoireRepository",
        ),
      }).run({ territoireCode: territoireCode as string }),
    );

    const avancementTerritoire =
      await new RécupérerTauxAvancementTerritoireUseCase({
        chantierRepository: getContainer("legacy").resolve(
          "ficheTerritorialeChantierRepository",
        ),
        territoireRepository: getContainer("legacy").resolve(
          "ficheTerritorialeTerritoireRepository",
        ),
      })
        .run({ territoireCode, jalon })
        .then(presenterEnTauxAvancementAnnuelTerritoireContrat);

    const répartitionMétéos = await new RécupérerRépartitionMétéoUseCase({
      chantierRepository: getContainer("legacy").resolve(
        "ficheTerritorialeChantierRepository",
      ),
      territoireRepository: getContainer("legacy").resolve(
        "ficheTerritorialeTerritoireRepository",
      ),
    })
      .run({ territoireCode, jalon })
      .then(presenterEnRépartitionsMétéosContrat);

    const chantiersFicheTerritoriale =
      await new RécupérerListeChantierFicheTerritorialeUseCase({
        chantierRepository: getContainer("legacy").resolve(
          "ficheTerritorialeChantierRepository",
        ),
        territoireRepository: getContainer("legacy").resolve(
          "ficheTerritorialeTerritoireRepository",
        ),
        syntheseDesResultatsRepository: getContainer("legacy").resolve(
          "ficheTerritorialeSyntheseDesResultatsRepository",
        ),
        indicateurRepository: getContainer("legacy").resolve(
          "ficheTerritorialeIndicateurRepository",
        ),
        ministereRepository: getContainer("legacy").resolve(
          "ficheTerritorialeMinistereRepository",
        ),
      })
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
