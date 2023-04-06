import CompteurCaractèresProps from './CompteurCaractères.interface';

export default function CompteurCaractères({ compte, limiteDeCaractères }: CompteurCaractèresProps) {
  return (
    <p className='fr-text--xs fr-mb-0 texte-droite'>
      {compte}
      /
      {limiteDeCaractères}
    </p>
  );
}
