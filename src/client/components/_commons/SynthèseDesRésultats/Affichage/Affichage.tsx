import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import { LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS } from '@/validation/synthèseDesRésultats';
import SynthèseDesRésultatsAffichageProps from './Affichage.interface';

export default function SynthèseDesRésultatsAffichage({ 
  synthèseDesRésultats, 
  afficherContenuComplet = true,
}: SynthèseDesRésultatsAffichageProps) {
  if (!synthèseDesRésultats) {
    return (
      <p className='fr-text--sm texte-gris'>
        Aucune synthèse des résultats.
      </p>
    );
  }

  const contenuAAfficher = 
    afficherContenuComplet || synthèseDesRésultats.contenu.length <= LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS 
      ? synthèseDesRésultats.contenu 
      : synthèseDesRésultats.contenu.slice(0, LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS) + '...';

  return (
    <>
      <p className='fr-text--xs texte-gris fr-mb-1w'>
        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date, 'DD/MM/YYYY')}`}
        {!!synthèseDesRésultats.auteur && ` | Par ${synthèseDesRésultats.auteur}`}
      </p>
      <p
        className='fr-text--sm fr-mb-0'
    // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenuAAfficher),
        }}
      />
    </>

  );
}
