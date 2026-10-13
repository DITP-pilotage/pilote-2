import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { Commentaires } from "@/components/PageChantier/Commentaires/Commentaires";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/shared/chantier/commentaire/Commentaire.interface";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionCommentaires = () => {
  const { chantier } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  const { estAutoriseAModifierLesPublications } = usePageChantier();

  const estChantierArchive = chantier.statut === "ARCHIVE";

  const infobulle =
    territoireSélectionné.maille === "nationale"
      ? INFOBULLE_CONTENUS.chantier.commentaires.territoireNational
      : INFOBULLE_CONTENUS.chantier.commentaires.territoireNonNational;

  return (
    <BasePageChantierSection
      id="commentaires"
      infobulle={infobulle}
      titreConteneurClassName="mb-4 mt-3 md:mt-6 mx-4 md:mx-0"
      titre="Commentaires du chantier"
    >
      <Commentaires
        estChantierArchive={estChantierArchive}
        modeÉcriture={estAutoriseAModifierLesPublications}
        typesCommentaire={
          territoireSélectionné.maille === "nationale"
            ? typesCommentaireMailleNationale
            : typesCommentaireMailleRégionaleOuDépartementale
        }
      />
    </BasePageChantierSection>
  );
};
