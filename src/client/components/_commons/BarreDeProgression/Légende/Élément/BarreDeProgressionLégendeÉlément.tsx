import {
  TypeDeCurseur,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur.interface';
import {
  barreDeProgressionCurseurGéométries,
} from '@/components/_commons/BarreDeProgression/Curseur/BarreDeProgressionCurseur';
import BarreDeProgressionLégendeÉlémentStyled from './BarreDeProgressionLégendeÉlément.styled';

interface BarreDeProgressionLégendeÉlémentProps {
  typeDeCurseur: TypeDeCurseur,
  libellé: string,
}

export default function BarreDeProgressionLégendeÉlément({ typeDeCurseur, libellé }: BarreDeProgressionLégendeÉlémentProps) {
  return (
    <BarreDeProgressionLégendeÉlémentStyled>
      <svg
        viewBox="-12 -20 24 24"
        width="0.75rem"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barreDeProgressionCurseurGéométries[typeDeCurseur]}
      </svg>
      <span className="fr-pl-1v fr-m-0 fr-text--xs">
        {libellé}
      </span>
    </BarreDeProgressionLégendeÉlémentStyled>
  );
}
