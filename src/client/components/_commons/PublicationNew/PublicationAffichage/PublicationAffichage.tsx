import { FunctionComponent } from 'react';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import Badge from '@/client/components/_commons/Badge/Badge';
import PublicationProps from '@/client/components/_commons/Publication/Publication.interface';

interface PublicationAffichageProps {
  publication: PublicationProps['publicationInitiale']
}

const PublicationAffichage: FunctionComponent<PublicationAffichageProps> = ({ publication }) => {
  if (!publication) {
    return (
      <Badge type='gris'>
        Non renseigné
      </Badge>
    );
  }

  return (
    <>
      <p className='fr-text--xs texte-gris fr-mb-1w'>
        {`Mis à jour le ${formaterDate(publication.date, 'DD/MM/YYYY')}`}
        {
          !!publication.auteur && 
          ` | Par ${publication.auteur}`
        }
      </p>
      <p
        className='fr-text--sm fr-mb-0'
      // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(publication.contenu),
        }}
      />
    </>
  );
};

export default PublicationAffichage;
