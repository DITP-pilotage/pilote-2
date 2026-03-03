import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { BoutonsAffichage } from "@/components/PageChantier/SynthèseDesRésultatsChantier/BoutonsAffichage/BoutonsAffichage";
import { DerniereSyntheseDesResultats } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";
import useAffichage from "./useAffichage";

const SynthèseDesRésultatsAffichage = ({
  itemHistoriqueSyntheseDesResultats: synthèseDesRésultats,
}: {
  itemHistoriqueSyntheseDesResultats: DerniereSyntheseDesResultats | null;
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
      <p className="fr-text--sm !text-dsfr-mention-grey">
        Aucune synthèse des résultats.
      </p>
    );
  }

  return (
    <>
      <p className="fr-text--xs !text-dsfr-mention-grey fr-mb-1w">
        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date_modification, "DD/MM/YYYY")}`}
        {!!synthèseDesRésultats.auteur_modification_nom &&
          ` | Par ${synthèseDesRésultats.auteur_modification_nom}`}
      </p>
      <p
        className="fr-text--sm fr-mb-0"
        dangerouslySetInnerHTML={{
          __html:
            nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenuAAfficher),
        }}
      />
      {afficherBoutonsAffichage ? (
        <BoutonsAffichage
          afficherVoirMoins={afficherContenuComplet}
          afficherVoirPlus={!afficherContenuComplet}
          déplierLeContenu={déplierLeContenu}
          replierLeContenu={replierLeContenu}
        />
      ) : null}
    </>
  );
};

export default SynthèseDesRésultatsAffichage;
