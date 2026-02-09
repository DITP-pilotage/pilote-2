import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import BoutonsAffichage from "@/components/PageRapportDétaillé/SynthèseDesRésultats/BoutonsAffichage/BoutonsAffichage";
import SynthèseDesRésultatsInterface from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";
import useAffichage from "./useAffichage";

interface SynthèseDesRésultatsAffichageProps {
  synthèseDesRésultats: SynthèseDesRésultatsInterface;
}

const SynthèseDesRésultatsAffichage = ({
  synthèseDesRésultats,
}: SynthèseDesRésultatsAffichageProps) => {
  const {
    contenuAAfficher,
    afficherBoutonsAffichage,
    afficherContenuComplet,
    déplierLeContenu,
    replierLeContenu,
  } = useAffichage(synthèseDesRésultats);

  if (!synthèseDesRésultats) {
    return (
      <p className="fr-text--sm texte-gris">Aucune synthèse des résultats.</p>
    );
  }

  return (
    <>
      <p className="fr-text--xs texte-gris fr-mb-1w">
        {`Mis à jour le ${formaterDate(synthèseDesRésultats.date, "DD/MM/YYYY")}`}
        {!!synthèseDesRésultats.auteur &&
          ` | Par ${synthèseDesRésultats.auteur}`}
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
