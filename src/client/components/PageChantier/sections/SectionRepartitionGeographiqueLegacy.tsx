import { parseAsString, useQueryState } from "nuqs";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Alerte from "@/components/_commons/Alerte/Alerte";
import CartographieAvecSelecteur from "@/components/_commons/Cartographie/CartographieAvecSelecteur/CartographieAvecSelecteur";
import { useEnv } from "@/client/hooks/useEnv";
import { ComparaisonTerritoires } from "@/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires";
import { CartographieType } from "@/components/PageChantier/Cartes/Cartes";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { BasePageChantierSection } from "./BasePageChantierSection";

export const SectionRepartitionGeographiqueLegacy = () => {
  const {
    chantier,
    jalon,
    mailleQuery,
    mailleSelectionnee,
    territoireCode,
    cartographieGaucheChantier,
    cartographieDroiteChantier,
  } = pageChantier.useServerSidePropsContext();

  const territoireSélectionné = useTerritoireSelectionne();

  const featureComparaisonTerritoires = useEnv(
    "NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES",
  );

  const mailleSourceDonnees =
    chantier.mailles[territoireSélectionné.maille][territoireCode]
      .mailleSourceDonnees;

  const estVisible =
    !!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
    !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
    chantier.estTerritorialisé;

  const afficheCarteAvancement =
    !!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
    chantier.estTerritorialisé;
  const afficheCarteMétéo =
    !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
    chantier.estTerritorialisé;

  const [, setCartographieGaucheSelection] = useQueryState(
    "carteChG",
    parseAsString.withDefault("avancementJalon").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  const [, setCartographieDroiteSelection] = useQueryState(
    "carteChD",
    parseAsString.withDefault("meteo").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  if (!estVisible) {
    return null;
  }

  return (
    <div className="fr-my-2w">
      <BasePageChantierSection
        id="cartes"
        sectionClassName="print:break-inside-avoid"
        titre="Répartition géographique"
      >
        <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
          {afficheCarteAvancement ? (
            <div className="print:break-inside-avoid">
              <Bloc>
                <section>
                  <CartographieAvecSelecteur
                    aLaSelectionCartographie={(valeur: CartographieType) =>
                      setCartographieGaucheSelection(valeur)
                    }
                    cartographieSelectionnee={cartographieGaucheChantier}
                    chantierMailles={chantier.mailles}
                    estInteractif
                    jalon={jalon}
                    listeCartographiesDesactives={[cartographieDroiteChantier]}
                    mailleQuery={mailleQuery}
                    territoireCode={territoireCode}
                  />
                  {mailleSourceDonnees === "regionale" && (
                    <Alerte
                      classesSupplementaires="fr-mt-2w"
                      message="Données régionales"
                      type="info"
                    />
                  )}
                </section>
              </Bloc>
            </div>
          ) : null}
          {afficheCarteMétéo ? (
            <div className="print:break-inside-avoid">
              <Bloc>
                <section>
                  <CartographieAvecSelecteur
                    aLaSelectionCartographie={(valeur: CartographieType) =>
                      setCartographieDroiteSelection(valeur)
                    }
                    cartographieSelectionnee={cartographieDroiteChantier}
                    chantierMailles={chantier.mailles}
                    estInteractif
                    jalon={jalon}
                    listeCartographiesDesactives={[cartographieGaucheChantier]}
                    mailleQuery={mailleQuery}
                    territoireCode={territoireCode}
                  />
                </section>
              </Bloc>
            </div>
          ) : null}
        </div>
        {featureComparaisonTerritoires ? (
          <div className="mt-4">
            <ComparaisonTerritoires
              chantierId={chantier.id}
              jalon={jalon}
              maille={mailleQuery}
              territoireCode={territoireCode}
            />
          </div>
        ) : null}
      </BasePageChantierSection>
    </div>
  );
};
