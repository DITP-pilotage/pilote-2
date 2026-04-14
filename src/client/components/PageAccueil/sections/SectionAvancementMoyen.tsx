import { parseAsStringLiteral, useQueryStates } from "nuqs";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { useSelecteurJalon } from "@/components/_commons/SelecteurJalon/useSelecteurJalon";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";
import { BasePageAccueilSection } from "./BasePageAccueilSection";

export const SectionAvancementMoyen = () => {
  const { moyenneTerritoire, jalon } = usePageAccueilContext();
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
      id="avancement-moyen"
      infobulle={INFOBULLE_CONTENUS.chantiers.jauges}
      titre="Taux d'avancement moyen"
    >
      <div className="flex w-full justify-center px-1 mt-2">
        <JaugeDeProgression
          couleur={chantiersSontArchives ? "gris" : "bleu"}
          libellé={`Taux d'avancement à échéance ${jalon}`}
          pourcentage={moyenneTerritoire}
          taille="lg"
        />
      </div>
    </BasePageAccueilSection>
  );
};
