import { FunctionComponent } from 'react';
import PageErreur from '@/components/_commons/PageErreur/PageErreur';

const Erreur500: FunctionComponent<{}> = () => {
  return (
    <PageErreur
      message='Nous vous invitons à réessayer plus tard.'
      sousTitre='Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus rapidement possible.'
      titre='Erreur inattendue'
    />
  );
};

export default Erreur500;
