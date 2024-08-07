import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import PictoTerritorialisé from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé';
import PictoChantierBrouillon from '@/components/_commons/PictoChantierBrouillon/PictoChantierBrouillon';
import TypologiesPictosStyled
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos.styled';
import TypologiesPictosProps from './TypologiesPictos.interface';

export default function TypologiesPictos({ typologies }: TypologiesPictosProps) {
  if (!typologies.estBaromètre && !typologies.estTerritorialisé && !typologies.estBrouillon) {
    return null;
  }

  return (
    <TypologiesPictosStyled className='flex fr-m-0 fr-p-0'>
      <li className='fr-mr-1v'>
        {
          typologies.estBaromètre ? (
            <PictoBaromètre />
          ) : null
        }
      </li>
      <li>
        {
          typologies.estTerritorialisé ? (
            <PictoTerritorialisé />
          ) : null
        }
      </li>
      <li>
        {
          typologies.estBrouillon ? (
            <PictoChantierBrouillon />
          ) : null
        }
      </li>
    </TypologiesPictosStyled>
  );
}
