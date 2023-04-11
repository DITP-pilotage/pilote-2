import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import PictoTerritorialisé from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé';
import PictosTypologieProps from './PictosTypologie.interface';

export default function PictosTypologie({ typologie }: PictosTypologieProps) {
  return (
    <>
      { typologie.estBaromètre ?
        <PictoBaromètre
          className='fr-mr-1w'
          taille={{ mesure: 1.25, unité: 'rem' }}
        /> 
        : null}
      {  typologie.estTerritorialisé ? <PictoTerritorialisé /> : null}
    </>
  );
}
