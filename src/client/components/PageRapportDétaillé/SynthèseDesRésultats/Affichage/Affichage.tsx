import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import SynthèseDesRésultatsInterface from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultats.interface";

interface SynthèseDesRésultatsAffichageProps {
  synthèseDesRésultats: SynthèseDesRésultatsInterface;
}

const SynthèseDesRésultatsAffichage = ({
  synthèseDesRésultats,
}: SynthèseDesRésultatsAffichageProps) => {
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
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(
            synthèseDesRésultats.contenu,
          ),
        }}
      />
    </>
  );
};

export default SynthèseDesRésultatsAffichage;
