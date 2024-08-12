import { FunctionComponent } from 'react';
import PageErreur from '@/components/_commons/PageErreur/PageErreur';

const Erreur500: FunctionComponent<{}> = () => {
  return (
    <PageErreur
      message='Nous vous invitons à réessayer plus tard.'
      sousTitre='PILOTE n’est actuellement pas accessible. Nous vous prions de bien vouloir nous excuser pour la gêne occasionnée.'
      titre='Application indisponible'
    />
  );
};

export default Erreur500;
