import { parseAsStringLiteral, useQueryStates } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { JaugeDeProgressionSmall } from "@/components/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionRepartitionTerritoriale = () => {
  const { avancementsAgrégés, jalon } = usePageAccueilContext();
  const { listeJalonAAfficher } = useSelecteurJalon();

  const [filtres] = useQueryStates({
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(listeJalonAAfficher),
  });

  const chantiersSontArchives = filtres.statut?.includes("ARCHIVE") ?? false;

  return (
    <BasePageAccueilSection
      id="repartition-territoriale"
      infobulle={INFOBULLE_CONTENUS.chantiers.repartitions}
      titre={`Répartition territoriale ${jalon}`}
    >
      <Bloc className="h-full" contenuClassesSupplémentaires="fr-p-2w">
        <div className="flex flex-col items-center px-3">
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "vert"}
            libellé="Maximum"
            pourcentage={avancementsAgrégés.maximum || null}
          />
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "violet"}
            libellé="Médiane"
            pourcentage={avancementsAgrégés.médiane || null}
          />
          <JaugeDeProgressionSmall
            couleur={chantiersSontArchives ? "gris" : "orange"}
            libellé="Minimum"
            pourcentage={avancementsAgrégés.minimum || null}
          />
        </div>
      </Bloc>
    </BasePageAccueilSection>
  );
};
