import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { formaterDate } from "@/client/utils/date/date";
import Champ from "@/components/_commons/Champ";

const SectionTableauIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
}> = ({ indicateur, informationHistorisationIndicateur }) => {
  const creation = `${formaterDate(informationHistorisationIndicateur.dateCreation, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurCreation}`;
  const derniereModification = `${formaterDate(informationHistorisationIndicateur.dateDerniereModification, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurModification}`;

  return (
    <div className="rounded-lg bg-blue-50 p-6 mb-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        <Champ label="Chantier associé" valeur={indicateur.indicParentCh} />
        <div className="col-span-2">
          <Champ label="Nom du chantier" valeur={indicateur.chantierNom} />
        </div>
        <Champ label="Identifiant indicateur" valeur={indicateur.indicId} />
        <div className="col-span-2">
          <Champ label="Nom de l'indicateur" valeur={indicateur.indicNom} />
        </div>
        <Champ label="Création de l'indicateur" valeur={creation} />
        <div className="col-span-2">
          <Champ label="Dernière modification" valeur={derniereModification} />
        </div>
      </div>
    </div>
  );
};

export default SectionTableauIndicateur;
