import { FunctionComponent, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { IndicateurEvolution } from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurEvolution";
import IndicateurSpécifications from "@/components/_commons/IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications";
import { IndicateurDetailsParTerritoire } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import CartographieAvecSelecteurIndicateur from "@/components/_commons/Cartographie/CartographieAvecSelecteurIndicateur/CartographieAvecSelecteurIndicateur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useIndicateurDétails } from "./useIndicateurDétails";

export type CartographieIndicateurType =
  | "avancementMandat"
  | "avancementJalon"
  | "propositionValeur"
  | "valeurAvancement";
interface IndicateurDétailsProps {
  indicateurDétailsParTerritoiresComparés: IndicateurDetailsParTerritoire[];
  dateDeMiseAJourIndicateur: string | null;
  detailsIndicateursTerritoire: DétailsIndicateurs;
  dateValeurAvancement: string | null;
  dateProchaineDateMaj: string | null;
  dateProchaineDateValeurAvancement: string | null;
  mailleQuery: MailleInterne;
  mailsDirecteursProjets: string[];
  cartographieDroiteIndicateur: CartographieIndicateurType;
  cartographieGaucheIndicateur: CartographieIndicateurType;
}

export const IndicateurDétails: FunctionComponent<IndicateurDétailsProps> = ({
  indicateurDétailsParTerritoiresComparés,
  dateDeMiseAJourIndicateur,
  detailsIndicateursTerritoire,
  dateValeurAvancement,
  dateProchaineDateMaj,
  dateProchaineDateValeurAvancement,
  mailleQuery,
  mailsDirecteursProjets,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
}) => {
  const {
    indicateur,
    chantier: { estTerritorialisé: chantierEstTerritorialisé },
    detailIndicateurDuTerritoire,
    jalon,
    territoireCode,
  } = useBlocIndicateurContext();

  const [futOuvert, setFutOuvert] = useState(false);

  const {
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurAvancementTerritorialisées,
  } = useIndicateurDétails(detailsIndicateursTerritoire[indicateur.id]);

  const nomDefinitionDeLindicateur =
    "Description de l'indicateur et calendrier de mise à jour";
  const nomRepartitionGeographiqueEtEvolution =
    "Répartition géographique et évolution";

  const responsablesDonnees =
    indicateur.responsablesDonneesMails.length > 0
      ? indicateur.responsablesDonneesMails
      : mailsDirecteursProjets;

  const [, setCartographieGaucheSelection] = useQueryState(
    "carteIndG",
    parseAsString.withDefault("avancementMandat").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  const [, setCartographieDroiteSelection] = useQueryState(
    "carteIndD",
    parseAsString.withDefault("valeurAvancement").withOptions({
      shallow: false,
      history: "push",
      clearOnDefault: true,
    }),
  );

  return (
    <div className="fr-accordions-group">
      <section className="fr-accordion">
        <h3 className="fr-accordion__title">
          <button
            aria-controls={`détails-${indicateur.id}`}
            aria-expanded="false"
            className="fr-accordion__btn"
            onClick={() => setFutOuvert(true)}
            title={nomDefinitionDeLindicateur}
            type="button"
          >
            {nomDefinitionDeLindicateur}
          </button>
        </h3>
        <div className="fr-collapse" id={`détails-${indicateur.id}`}>
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w">
              <div className="fr-col-12">
                {futOuvert ? (
                  <IndicateurSpécifications
                    dateProchaineDateMaj={dateProchaineDateMaj}
                    dateProchaineDateValeurAvancement={
                      dateProchaineDateValeurAvancement
                    }
                    dateValeurAvancement={dateValeurAvancement}
                    responsablesMails={responsablesDonnees}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="fr-accordion">
        <h3 className="fr-accordion__title">
          <button
            aria-controls={`repartition-geographique-et-evolution-${indicateur.id}`}
            aria-expanded="false"
            className="fr-accordion__btn"
            onClick={() => setFutOuvert(true)}
            title={nomRepartitionGeographiqueEtEvolution}
            type="button"
          >
            {nomRepartitionGeographiqueEtEvolution}
          </button>
        </h3>
        <div
          className="fr-collapse"
          id={`repartition-geographique-et-evolution-${indicateur.id}`}
        >
          <div className="fr-container">
            <div className="fr-grid-row fr-grid-row--gutters fr-my-1w">
              {futOuvert &&
              (donnéesCartographieAvancementTerritorialisées ||
                donnéesCartographieValeurAvancementTerritorialisées ||
                chantierEstTerritorialisé) ? (
                <>
                  <section className="fr-col-12 fr-col-xl-6">
                    <CartographieAvecSelecteurIndicateur
                      aLaSelectionCartographie={(
                        valeur: CartographieIndicateurType,
                      ) => setCartographieGaucheSelection(valeur)}
                      cartographieSelectionnee={cartographieGaucheIndicateur}
                      detailsIndicateurTerritoire={
                        detailsIndicateursTerritoire[indicateur.id]
                      }
                      jalon={jalon}
                      listeCartographiesDesactives={[
                        cartographieDroiteIndicateur,
                      ]}
                      mailleQuery={mailleQuery}
                      territoireCode={territoireCode}
                      unité={indicateur.unité}
                    />
                  </section>
                  <section className="fr-col-12 fr-col-xl-6">
                    <CartographieAvecSelecteurIndicateur
                      aLaSelectionCartographie={(
                        valeur: CartographieIndicateurType,
                      ) => setCartographieDroiteSelection(valeur)}
                      cartographieSelectionnee={cartographieDroiteIndicateur}
                      detailsIndicateurTerritoire={
                        detailsIndicateursTerritoire[indicateur.id]
                      }
                      jalon={jalon}
                      listeCartographiesDesactives={[
                        cartographieGaucheIndicateur,
                      ]}
                      mailleQuery={mailleQuery}
                      territoireCode={territoireCode}
                      unité={indicateur.unité}
                    />
                  </section>
                </>
              ) : null}
              {futOuvert && detailIndicateurDuTerritoire ? (
                <section className="fr-col-12">
                  <IndicateurEvolution
                    dateDeMiseAJourIndicateur={
                      dateDeMiseAJourIndicateur ?? "Non renseignée"
                    }
                    indicateurDetailsParTerritoiresCompares={
                      indicateurDétailsParTerritoiresComparés
                    }
                  />
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
