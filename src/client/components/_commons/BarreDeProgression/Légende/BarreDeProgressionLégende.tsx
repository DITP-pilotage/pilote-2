import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import BarreDeProgressionLégendeÉlément from './Élément/BarreDeProgressionLégendeÉlément';
import BarreDeProgressionLégendeStyled from './BarreDeProgressionLégende.styled';

export default function BarreDeProgressionLégende() {
  return (
    <BarreDeProgressionLégendeStyled>
      <li className='fr-pr-2w'>
        <BarreDeProgressionLégendeÉlément
          libellé="Minimum"
          typeDeCurseur={TypeDeCurseur.MINIMUM}
        />
      </li>
      <li className='fr-pr-2w'>
        <BarreDeProgressionLégendeÉlément
          libellé="Médiane"
          typeDeCurseur={TypeDeCurseur.MÉDIANE}
        />
      </li>
      <li className='fr-pr-2w'>
        <BarreDeProgressionLégendeÉlément
          libellé="Maximum"
          typeDeCurseur={TypeDeCurseur.MAXIMUM}
        />
      </li>
    </BarreDeProgressionLégendeStyled>
  );
}
