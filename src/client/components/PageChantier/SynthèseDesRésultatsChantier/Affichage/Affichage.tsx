import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { BoutonsAffichage } from "@/components/PageChantier/SynthèseDesRésultatsChantier/BoutonsAffichage/BoutonsAffichage";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { SyntheseDesResultatsHistoriqueItem } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import useAffichage from "./useAffichage";

const SynthèseDesRésultatsAffichage = ({
  itemHistoriqueSyntheseDesResultats: synthèseDesRésultats,
  onModifier,
}: {
  itemHistoriqueSyntheseDesResultats: SyntheseDesResultatsHistoriqueItem | null;
  onModifier?: () => void;
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
      <p className="text-xs text-dsfr-mention-grey mb-1">
        {synthèseDesRésultats.dateCreation ===
        synthèseDesRésultats.dateModification
          ? `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateCreation)} | Par ${synthèseDesRésultats.auteurCreationNom}`
          : `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateCreation)} par ${synthèseDesRésultats.auteurCreationNom} et modifié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateModification)} par ${synthèseDesRésultats.auteurModificationNom}`}
      </p>
      {!!onModifier ? (
        <div className="flex items-center gap-1 mb-3">
          <BoutonSousLigné
            className="text-dsfr-mention-grey text-xs"
            iconLeft={
              <Icone className="w-3 h-3 text-current" icone={Icone1Icon} />
            }
            onClick={onModifier}
          >
            Modifier le commentaire
          </BoutonSousLigné>
          <Infobulle
            classNameBouton="text-dsfr-mention-grey"
            classNameIcone="w-5 h-5"
          >
            Toute modification de commentaire annule et remplace le commentaire
            affiché.
          </Infobulle>
        </div>
      ) : null}
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
