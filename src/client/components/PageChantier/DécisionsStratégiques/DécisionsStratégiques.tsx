import Bloc from "@/components/_commons/Bloc/Bloc";
import { CommentaireSection } from "@/components/_commons/CommentairesNew/CommentaireSection/CommentaireSection";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import {
  consignesEcritureDecisionStrategique,
  libellésTypesDécisionStratégique,
} from "@/client/constants/libellésDécisionStratégique";
import { HistoriqueDecisionStrategique } from "./HistoriqueDecisionStrategique";
import { useDecisionStrategiqueActions } from "./useDecisionStrategiqueActions";

const TYPE = "suiviDesDecisionsStrategiques" as const;

export const DécisionsStratégiques = ({
  modeEcriture = false,
  estChantierArchive,
}: {
  modeEcriture?: boolean;
  estChantierArchive: boolean;
}) => {
  const { chantier, décisionStratégique, brouillonDecisionStrategique } =
    pageChantier.useServerSidePropsContext();

  const actions = useDecisionStrategiqueActions({
    chantierId: chantier.id,
    type: TYPE,
    decisionStrategique: décisionStratégique,
    brouillon: brouillonDecisionStrategique,
  });

  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
      }
      titre="France"
    >
      <CommentaireSection
        actions={actions}
        brouillon={brouillonDecisionStrategique}
        consigne={consignesEcritureDecisionStrategique[TYPE]}
        historiqueNode={<HistoriqueDecisionStrategique />}
        libelle={libellésTypesDécisionStratégique[TYPE]}
        modeEcriture={modeEcriture}
        publication={décisionStratégique}
      />
    </Bloc>
  );
};
