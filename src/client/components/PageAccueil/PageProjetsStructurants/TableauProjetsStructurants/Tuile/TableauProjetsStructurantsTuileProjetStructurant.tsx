import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import TableauProjetsStructurantsTuileProjetStructurantStyled from './TableauProjetsStructurantsTuileProjetStructurant.styled';
import TableauProjetsStructurantsTuileProjetStructurantProps from './TableauProjetsStructurantsTuileProjetStructurant.interface';

export default function TableauProjetsStructurantsTuileProjetStructurant({ projetStructurant, afficherIcône }: TableauProjetsStructurantsTuileProjetStructurantProps) {

  return (
    <TableauProjetsStructurantsTuileProjetStructurantStyled>
      <div className='tuile-chantier-entête'>
        <p className='fr-mb-0 fr-ml-n1w'>
          <IcônesMultiplesEtTexte
            icônesId={afficherIcône && projetStructurant.iconesMinistères ? projetStructurant.iconesMinistères : []}
            largeurDesIcônes='3.5rem'
            texteAlternatifPourIcônes={undefined}
          >
            <span className='fr-text--sm'>
              {projetStructurant.nom}
            </span>
          </IcônesMultiplesEtTexte>
        </p>
      </div>
      <div className='fr-mt-1w fr-ml-5v tuile-chantier-corps'>
        <div className='météo'>
          <TableauRéformesMétéo
            dateDeMàjDonnéesQualitatives={undefined}
            météo={projetStructurant.météo}
            taille='sm'
          />
        </div>
        <div className='avancement'>
          <TableauRéformesAvancement
            avancement={projetStructurant.avancement}
            dateDeMàjDonnéesQuantitatives={undefined}
          />
        </div>
      </div>
    </TableauProjetsStructurantsTuileProjetStructurantStyled>
  );
}
