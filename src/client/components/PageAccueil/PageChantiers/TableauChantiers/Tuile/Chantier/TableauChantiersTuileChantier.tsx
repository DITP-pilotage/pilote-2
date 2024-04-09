import TableauChantiersTuileChantierStyled
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tuile/Chantier/TableauChantiersTuileChantier.styled';
import TypologiesPictos
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import PictoTendance from '@/components/_commons/PictoTendance/PictoTendance';
import TexteColoré from '@/components/_commons/TexteColoré/TexteColoré';
import { définirCouleurÉcartArrondi } from '@/client/utils/chantier/écart/écart';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import TableauChantiersTuileChantierProps from './TableauChantiersTuileChantier.interface';

export default function TableauChantiersTuileChantier({ chantier, afficherIcône }: TableauChantiersTuileChantierProps) {
  const couleurÉcartArrondi = définirCouleurÉcartArrondi(chantier.écart);

  return (
    <TableauChantiersTuileChantierStyled>
      <div className='tuile-chantier-entête'>
        <div className='fr-mb-0 fr-ml-n1w'>
          <IcônesMultiplesEtTexte
            icônesId={afficherIcône && chantier.porteur?.icône ? [chantier.porteur.icône] : []}
            largeurDesIcônes='1.75rem'
            texteAlternatifPourIcônes={chantier.porteur?.nom ?? undefined}
          >
            <span className='fr-text--sm'>
              {chantier.nom}
            </span>
          </IcônesMultiplesEtTexte>
        </div>
        <div className='fr-ml-2w'>
          <TypologiesPictos typologies={chantier.typologie} />
        </div>
      </div>
      <div className='fr-mt-1w fr-ml-5v tuile-chantier-corps'>
        <div className='météo'>
          <TableauRéformesMétéo
            dateDeMàjDonnéesQualitatives={chantier.dateDeMàjDonnéesQualitatives}
            météo={chantier.météo}
            taille='sm'
          />
        </div>
        <div className='avancement'>
          <TableauRéformesAvancement
            avancement={chantier.avancement}
            dateDeMàjDonnéesQuantitatives={chantier.dateDeMàjDonnéesQuantitatives}
          />
        </div>
        {
          (process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true') &&
          <PictoTendance tendance={chantier.tendance} />
        }
        {
          (process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true') && !!couleurÉcartArrondi &&
          <TexteColoré
            alignement='droite'
            couleur={couleurÉcartArrondi.couleur}
            estGras
            texte={`${couleurÉcartArrondi.écartArrondi.toFixed(1)}`}
          />
        }
      </div>
    </TableauChantiersTuileChantierStyled>
  );
}
