import { FunctionComponent } from 'react';
import PageErreur from '@/components/_commons/PageErreur/PageErreur';

const Erreur404: FunctionComponent<{}> = () => {
  return (
    <PageErreur
      message=" Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La page n’est peut-être plus disponible."
      sousTitre='La page que vous cherchez est introuvable. Excusez-nous pour la gène occasionnée.'
      titre='Page non trouvée'
    />
  );
};

export default Erreur404;
