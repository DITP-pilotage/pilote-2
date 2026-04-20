import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import { Commentaires } from "@/components/PageChantier/Commentaires/Commentaires";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
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
      titreConteneurClassName="fr-mb-2w fr-mt-3v fr-mt-md-3w fr-mx-2w fr-mx-md-0"
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
