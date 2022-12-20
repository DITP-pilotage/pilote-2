import BarreDeProgressionCurseurProps, { TypeDeCurseur } from './BarreDeProgressionCurseur.interface';
import styles from './BarreDeProgressionCurseur.base.module.scss';
import stylesÀPartirDeLaVariante from './BarreDeProgressionCurseur.variante.module.scss';

const curseurs = {
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
      points="0,0 0,-24"
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
    <div
      className="flex justifyEnd"
      style={{
        width: `${valeur * 100}%`,
      }}
    >
      <svg
        className={`
          ${styles.curseur}
          ${stylesÀPartirDeLaVariante[variante]}
       `}
        viewBox="-12 -20 24 18"
        xmlns="http://www.w3.org/2000/svg"
      >
        {
          curseurs[typeDeCurseur]
        }
      </svg>
    </div>
  );
}
