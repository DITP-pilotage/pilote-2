import { FunctionComponent } from 'react';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import BoutonsAffichage from '@/components/_commons/SynthèseDesRésultats/BoutonsAffichage/BoutonsAffichage';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import useAffichage from './useAffichage';

interface SynthèseDesRésultatsAffichageProps {
  synthèseDesRésultats: RouterOutputs['synthèseDesRésultats']['récupérerLaPlusRécente']
}

const SynthèseDesRésultatsAffichage: FunctionComponent<SynthèseDesRésultatsAffichageProps> = ({
  synthèseDesRésultats,
}) => {

  const {
    contenuAAfficher,
    afficherBoutonsAffichage,
    afficherContenuComplet,
    déplierLeContenu,
    replierLeContenu,
  } = useAffichage(synthèseDesRésultats);

  if (!synthèseDesRésultats) {
    return (
      <p className='fr-text--sm texte-gris'>
        Aucune synthèse des résultats.
      </p>
    );
  }

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
      {
        afficherBoutonsAffichage ? (
          <BoutonsAffichage
            afficherVoirMoins={afficherContenuComplet}
            afficherVoirPlus={!afficherContenuComplet}
            déplierLeContenu={déplierLeContenu}
            replierLeContenu={replierLeContenu}
          />
        ) : null
      }
    </>

  );
};

export default SynthèseDesRésultatsAffichage;
