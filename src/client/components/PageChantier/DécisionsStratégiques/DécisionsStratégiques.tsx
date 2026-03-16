import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import Bloc from "@/components/_commons/Bloc/Bloc";
import CommentaireSection from "@/components/_commons/CommentairesNew/CommentaireSection/CommentaireSection";
import {
  BrouillonPublication,
  PublicationActions,
} from "@/components/_commons/CommentairesNew/CommentaireSection/Publication.interface";
import {
  DecisionStrategiqueV2,
  DecisionStrategiqueV2AvecNomsAuteurs,
} from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import {
  consignesEcritureDecisionStrategique,
  libellésTypesDécisionStratégique,
} from "@/client/constants/libellésDécisionStratégique";
import { useNouvelleDecisionStrategique } from "./useNouvelleDecisionStrategique";
import { useEditerBrouillonDecisionStrategique } from "./useEditerBrouillonDecisionStrategique";
import { useModifierDecisionStrategique } from "./useModifierDecisionStrategique";
import HistoriqueDecisionStrategique from "./HistoriqueDecisionStrategique";

const TYPE = "suiviDesDécisionsStratégiques" as const;

export const DécisionsStratégiques = ({
  decisionStrategique,
  brouillon,
  modeEcriture = false,
  estChantierArchive,
}: {
  decisionStrategique: DecisionStrategiqueV2AvecNomsAuteurs | null;
  brouillon: DecisionStrategiqueV2 | null;
  modeEcriture?: boolean;
  estChantierArchive: boolean;
}) => {
  const { chantier } = pageChantier.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();

  const { publier, enregistrerEnBrouillon } = useNouvelleDecisionStrategique({
    chantierId: chantier.id,
    type: TYPE,
    onSuccess: () => refreshRouter(),
  });

  const {
    publier: publierBrouillon,
    enregistrerEnBrouillon: modifierBrouillon,
  } = useEditerBrouillonDecisionStrategique({
    brouillonId: brouillon?.id ?? "",
    onSuccess: () => refreshRouter(),
  });

  const modifier = useModifierDecisionStrategique({
    decisionStrategiqueId: decisionStrategique?.id ?? "",
    onSuccess: () => {},
  });

  const actions: PublicationActions = {
    publier,
    enregistrerEnBrouillon,
    publierBrouillon,
    modifierBrouillon,
    modifier,
  };

  const brouillonPublication: BrouillonPublication | null = brouillon
    ? {
        id: brouillon.id,
        contenu: brouillon.contenu,
        dateModification: brouillon.dateModification,
      }
    : null;

  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
      }
      titre="France"
    >
      <CommentaireSection
        actions={actions}
        brouillon={brouillonPublication}
        consigne={consignesEcritureDecisionStrategique[TYPE]}
        historiqueNode={<HistoriqueDecisionStrategique />}
        libelle={libellésTypesDécisionStratégique[TYPE]}
        modeEcriture={modeEcriture}
        publication={decisionStrategique}
      />
    </Bloc>
  );
};
