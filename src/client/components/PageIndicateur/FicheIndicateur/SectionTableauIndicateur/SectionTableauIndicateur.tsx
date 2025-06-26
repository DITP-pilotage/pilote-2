import { FunctionComponent } from 'react';
import SectionTableauIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionTableauIndicateur/SectionTableauIndicateur.styled';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { InformationHistorisationMetadataIndicateurContrat } from '@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat';
import { formaterDate } from '@/client/utils/date/date';

const SectionTableauIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat
}> = ({ indicateur, informationHistorisationIndicateur }) => {

  const creation = `${formaterDate(informationHistorisationIndicateur.dateCreation, 'DD/MM/YYYY')} par ${informationHistorisationIndicateur.auteurCreation}`;
  const derniereModification = `${formaterDate(informationHistorisationIndicateur.dateDerniereModification, 'DD/MM/YYYY')} par ${informationHistorisationIndicateur.auteurModification}`;

  return (
    <SectionTableauIndicateurStyled>
      <div className='fr-table'>
        <table>
          <thead>
            <tr>
              <th>
                Chantier associé
              </th>
              <th>
                Nom du chantier
              </th>
              <th>
                Identifiant indicateur
              </th>
              <th>
                Nom de l'indicateur
              </th>
              <th>
                Création de l'indicateur
              </th>
              <th>
                Dernière modification
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td title={indicateur.indicParentCh}>
                {indicateur.indicParentCh}
              </td>
              <td title={indicateur.chantierNom}>
                {indicateur.chantierNom}
              </td>
              <td title={indicateur.indicId}>
                {indicateur.indicId}
              </td>
              <td title={indicateur.indicNom}>
                {indicateur.indicNom}
              </td>
              <td title={creation}>
                {creation}
              </td>
              <td title={derniereModification}>
                {derniereModification}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionTableauIndicateurStyled>
  );
};

export default SectionTableauIndicateur;
