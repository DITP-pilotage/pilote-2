import Bloc from "@/components/_commons/Bloc/Bloc";
import { PublicationSection } from "@/components/PageChantier/Publication/PublicationSection";
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
      <PublicationSection
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
