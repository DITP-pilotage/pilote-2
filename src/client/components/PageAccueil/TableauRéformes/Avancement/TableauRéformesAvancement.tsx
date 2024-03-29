import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauRéformesAvancementProps
  from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import { formaterDate } from '@/client/utils/date/date';
import TableauRéformesAvancementStyled from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement.styled';

export default function TableauRéformesAvancement({ avancement, dateDeMàjDonnéesQuantitatives }: TableauRéformesAvancementProps) {
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  
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
              variante={typeDeRéforme === 'chantier' ? 'primaire' : 'rose'}
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
}
