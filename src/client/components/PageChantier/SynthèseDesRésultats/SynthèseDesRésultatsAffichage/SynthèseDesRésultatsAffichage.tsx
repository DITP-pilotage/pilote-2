import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import SynthèseDesRésultatsAffichageProps from './SynthèseDesRésultatsAffichage.interface';

export default function SynthèseDesRésultatsAffichage({ synthèseDesRésultats }: SynthèseDesRésultatsAffichageProps) {
  if (!synthèseDesRésultats) {
    return (
      <p className='fr-text--sm texte-gris'>
        Aucune synthèse des résultats.
      </p>
    );
  }
  return (
    <>
      <p className="fr-text--xs texte-gris fr-mb-1w">
        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date, 'jj/mm/aaaa')}`}
        {!!synthèseDesRésultats.auteur && ` | Par ${synthèseDesRésultats.auteur}`}
      </p>
      <p
        className="fr-text--sm fr-mb-0"
    // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(synthèseDesRésultats.contenu),
        }}
      />
    </>

  );
}
