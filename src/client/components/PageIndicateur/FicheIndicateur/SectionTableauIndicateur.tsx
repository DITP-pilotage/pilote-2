import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { formaterDate } from "@/client/utils/date/date";

const SectionTableauIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
}> = ({ indicateur, informationHistorisationIndicateur }) => {
  const creation = `${formaterDate(informationHistorisationIndicateur.dateCreation, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurCreation}`;
  const derniereModification = `${formaterDate(informationHistorisationIndicateur.dateDerniereModification, "DD/MM/YYYY")} par ${informationHistorisationIndicateur.auteurModification}`;

  return (
    <div className="fr-table">
      <table>
        <thead className="!bg-dsfr-blue-france-925 border !border-dsfr-grey-925">
          <tr>
            <th>Chantier associé</th>
            <th>Nom du chantier</th>
            <th>Identifiant indicateur</th>
            <th>Nom de l'indicateur</th>
            <th>Création de l'indicateur</th>
            <th>Dernière modification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="truncate max-w-20" title={indicateur.indicParentCh}>
              {indicateur.indicParentCh}
            </td>
            <td className="truncate max-w-20" title={indicateur.chantierNom}>
              {indicateur.chantierNom}
            </td>
            <td className="truncate max-w-20" title={indicateur.indicId}>
              {indicateur.indicId}
            </td>
            <td className="truncate max-w-20" title={indicateur.indicNom}>
              {indicateur.indicNom}
            </td>
            <td className="truncate max-w-20" title={creation}>
              {creation}
            </td>
            <td className="truncate max-w-20" title={derniereModification}>
              {derniereModification}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SectionTableauIndicateur;
