import SectionTableauIndicateurStyled
  from '@/components/PageIndicateur/FicheIndicateur/SectionTableauIndicateur/SectionTableauIndicateur.styled';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

export default function SectionTableauIndicateur({ indicateur }: {
  indicateur: MetadataParametrageIndicateurContrat
}) {
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
            </tr>
          </thead>
          <tbody>
            <tr>
              <td title={indicateur.indicParentCh}>
                {indicateur.indicParentCh}
              </td>
              <td title={indicateur.indicSchema}>
                {indicateur.chantierNom}
              </td>
              <td title={indicateur.indicId}>
                {indicateur.indicId}
              </td>
              <td title={indicateur.indicNom}>
                {indicateur.indicNom}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionTableauIndicateurStyled>

  );
}
