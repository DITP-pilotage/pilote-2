import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import PictoTerritorialisé from '@/components/_commons/PictoTerritorialisé/PictoTerritorialisé';
import PictosTypologieStyled from '@/components/PageChantiers/TableauChantiers/PictosTypologie/PictosTypologie.styled';
import PictosTypologieProps from './PictosTypologie.interface';

export default function PictosTypologie({ typologie }: PictosTypologieProps) {
  if (!typologie.estBaromètre && !typologie.estTerritorialisé) {
    return null;
  }

  return (
    <PictosTypologieStyled className="flex fr-m-0 fr-p-0">
      <li className="fr-mr-1v">
        {
          !!typologie.estBaromètre &&
          <PictoBaromètre />
        }
      </li>
      <li>
        {
          !!typologie.estTerritorialisé &&
          <PictoTerritorialisé />
        }
      </li>
    </PictosTypologieStyled>
  );
}
