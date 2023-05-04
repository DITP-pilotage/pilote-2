import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import PublicationAffichageProps from './PublicationAffichage.interface';

export default function PublicationAffichage({ publication }: PublicationAffichageProps) {
  if (!publication) {
    return (
      <p className="fr-mt-1v fr-badge fr-badge--no-icon">
        Non renseigné
      </p>
    );
  }

  return (
    <>
      <p className="fr-text--xs texte-gris fr-mb-1w">
        {`Mis à jour le ${formaterDate(publication.date, 'jj/mm/aaaa')}`}
        {
          !!publication.auteur && 
          ` | Par ${publication.auteur}`
        }
      </p>
      <p
        className="fr-text--sm fr-mb-0"
      // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(publication.contenu),
        }}
      />
    </>
  );
}
