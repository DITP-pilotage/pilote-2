import BarreDeProgressionCurseurProps, { TypeDeCurseur } from './BarreDeProgressionCurseur.interface';
import BarreDeProgressionCurseurStyled from './BarreDeProgressionCurseur.styled';

export const barreDeProgressionCurseurGéométries = {
  [TypeDeCurseur.MINIMUM]: (
    <polygon
      fill='transparent'
      points="-10,0 10,0 0,-18"
      strokeWidth='2'
    />
  ),
  [TypeDeCurseur.MÉDIANE]: (
    <polygon
      fill='transparent'
      points="0,2 0,-20"
      strokeWidth='2'
    />
  ),
  [TypeDeCurseur.MAXIMUM]: (
    <polygon
      points="-10,0 10,0 0,-18"
      strokeWidth='2'
    />
  ),
};

export default function BarreDeProgressionCurseur({ valeur, typeDeCurseur, variante }: BarreDeProgressionCurseurProps) {
  return (
    <BarreDeProgressionCurseurStyled
      className="flex justifyEnd"
      style={{
        width: `${valeur * 100}%`,
      }}
      variante={variante}
    >
      <svg
        viewBox="-12 -20 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {
          barreDeProgressionCurseurGéométries[typeDeCurseur]
        }
      </svg>
    </BarreDeProgressionCurseurStyled>
  );
}
