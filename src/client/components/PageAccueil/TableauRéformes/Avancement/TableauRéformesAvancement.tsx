import { FunctionComponent } from 'react';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { formaterDate } from '@/client/utils/date/date';
import TableauRéformesAvancementStyled from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement.styled';

interface TableauRéformesAvancementProps {
  avancement: number | null;
  dateDeMàjDonnéesQuantitatives?: string | null;
  estArchive?: boolean
}

const TableauRéformesAvancement: FunctionComponent<TableauRéformesAvancementProps> = ({ avancement, dateDeMàjDonnéesQuantitatives, estArchive }) => {
  const typeDeRéforme = 'chantier';
  
  return (
    <TableauRéformesAvancementStyled>
      {
        avancement === null
          ? (
            <span className='texte-gris fr-text--xs'>
              Non renseigné
            </span>
          ) : (
            <BarreDeProgression
              fond='blanc'
              taille='sm'
              valeur={avancement}
              variante={typeDeRéforme === 'chantier' ? (estArchive ? 'secondaire' : 'primaire') : 'rose'}
            />
          )
      }
      {
        !!dateDeMàjDonnéesQuantitatives &&
        <span className='texte-gris'>
          (
          { formaterDate(dateDeMàjDonnéesQuantitatives, 'MM/YYYY') }
          )
        </span>
      }
    </TableauRéformesAvancementStyled>
  );
};

export default TableauRéformesAvancement;
