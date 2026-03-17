import {
  consignesDÉcritureObjectif,
  libellésTypesObjectif,
  TypeObjectif,
} from "@/client/constants/libellésObjectif";
import { PublicationSection } from "@/components/PageChantier/PublicationV2/PublicationSection";
import { Accordion } from "@/components/shared/Accordion";
import {
  ObjectifV2,
  ObjectifV2AvecNomAuteur,
} from "@/server/domain/chantier/objectif/Objectif.interface";
import { useObjectifActions } from "./useObjectifActions";
import { HistoriqueObjectif } from "./HistoriqueObjectif";

export const ObjectifSection = ({
  chantierId,
  type,
  modeEcriture,
  objectif,
  brouillon,
}: {
  chantierId: string;
  type: TypeObjectif;
  modeEcriture: boolean;
  objectif: ObjectifV2AvecNomAuteur | null;
  brouillon: ObjectifV2 | null;
}) => {
  const actions = useObjectifActions({ chantierId, type, objectif, brouillon });

  return (
    <Accordion.Item value={type}>
      <Accordion.Header className="!bg-white border-t-0">
        <Accordion.Trigger className="py-3 text-primary">
          {libellésTypesObjectif[type]}
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="bg-white">
        <PublicationSection
          actions={actions}
          brouillon={brouillon}
          consigne={consignesDÉcritureObjectif[type]}
          historiqueNode={<HistoriqueObjectif type={type} />}
          libelle={libellésTypesObjectif[type]}
          modeEcriture={modeEcriture}
          publication={objectif}
          type={type}
        />
      </Accordion.Content>
    </Accordion.Item>
  );
};
