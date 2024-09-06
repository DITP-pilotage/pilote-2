import { FunctionComponent } from 'react';

interface CompteurCaractèresProps {
  compte: number
  limiteDeCaractères: number
}

const CompteurCaractères: FunctionComponent<CompteurCaractèresProps> = ({ compte, limiteDeCaractères }) =>{
  return (
    <p className='fr-text--xs fr-mb-0 texte-droite'>
      {compte}
      /
      {limiteDeCaractères}
    </p>
  );
};

export default CompteurCaractères;
