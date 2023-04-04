import TableauChantierTuileChantierStyled
  from '@/components/PageChantiers/TableauChantiers/Tuile/Chantier/TableauChantierTuileChantier.styled';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauChantierTuileChantierProps from './TableauChantierTuileChantier.interface';

export default function TableauChantierTuileChantier({ chantier }: TableauChantierTuileChantierProps) {
  return (
    <TableauChantierTuileChantierStyled>
      <div className="tuile-chantier-entête">
        <p className='fr-text--sm'>
          {chantier.nom}
        </p>
        <div className='fr-ml-2w'>
          {
            chantier.estBaromètre ? <PictoBaromètre taille={{ mesure: 1.25, unité: 'rem' }} /> : null
          }
        </div>
      </div>
      <div className='fr-mt-1w tuile-chantier-corps'>
        <div className="météo">
          <MétéoPicto valeur={chantier.météo} />
        </div>
        <div className='avancement fr-mr-2w'>
          <BarreDeProgression
            fond="blanc"
            taille="xs"
            valeur={chantier.avancement}
            variante='primaire'
          />
        </div>
      </div>
    </TableauChantierTuileChantierStyled>
  );
}
