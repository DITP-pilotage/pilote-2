import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { Infobulle } from "@/components/shared/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import { DécisionsStratégiques } from "@/components/PageChantier/DécisionsStratégiques/DécisionsStratégiques";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";

export const SectionDecisionsStrategiques = () => {
  const { chantier } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  const { estAutoriseAModifierLesPublications } = usePageChantier();

  const estChantierArchive = chantier.statut === "ARCHIVE";

  if (territoireSélectionné.maille !== "nationale") {
    return null;
  }

  return (
    <section
      className="grid grid-rows-[auto_1fr] print:block"
      id="décisions-stratégiques"
    >
      <TitreInfobulleConteneur className="!mb-4 !mt-3 !md:mt-0 !mx-4 !md:mx-0 flex items-center">
        <h2 className="text-h4 md:text-h4-md !m-0 inline">
          Décisions stratégiques
        </h2>
        <Infobulle>
          {INFOBULLE_CONTENUS.chantier.décisionsStratégiques}
        </Infobulle>
      </TitreInfobulleConteneur>
      <DécisionsStratégiques
        estChantierArchive={estChantierArchive}
        modeEcriture={estAutoriseAModifierLesPublications}
      />
    </section>
  );
};
