import { FunctionComponent, Suspense, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import {
  Accordion,
  CLASSES_DECLENCHEUR_ACCORDEON_DSFR,
  CLASSES_ENTETE_ACCORDEON_DSFR,
  CLASSES_CONTENU_ACCORDEON_DSFR,
  CLASSES_INTERIEUR_ACCORDEON_DSFR,
  CLASSES_ITEM_ACCORDEON_DSFR,
} from "@/components/shared/Accordion";
import { parseAsString, useQueryState } from "nuqs";
import { IndicateurEvolution } from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurEvolution";
import IndicateurSpécifications from "@/components/_commons/IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications";
import { IndicateurDetailsParTerritoire } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { DétailsIndicateurs } from "@/shared/indicateur/DetailsIndicateur.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { CartographieAvecSelecteurIndicateur } from "@/components/_commons/Cartographie/CartographieAvecSelecteurIndicateur/CartographieAvecSelecteurIndicateur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useIndicateurDetailsMode } from "@/components/PageChantier/IndicateurDetailsContext";
import { ComparaisonTerritoiresIndicateur } from "@/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur";
import { useIndicateurDétails } from "./useIndicateurDétails";

export type CartographieIndicateurType =
  "avancementJalon" | "propositionValeur" | "valeurAvancement";
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
    chantier: { estTerritorialisé: chantierEstTerritorialisé, id: chantierId },
    detailIndicateurDuTerritoire,
    jalon,
    territoireCode,
  } = useBlocIndicateurContext();

  const indicateurDetailsMode = useIndicateurDetailsMode();

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
    <Accordion.Root type="multiple">
      <Accordion.Item
        className={clsxm(CLASSES_ITEM_ACCORDEON_DSFR, "print:hidden")}
        value={`détails-${indicateur.id}`}
      >
        <Accordion.Header asChild className={CLASSES_ENTETE_ACCORDEON_DSFR}>
          <h3>
            <Accordion.Trigger
              className={CLASSES_DECLENCHEUR_ACCORDEON_DSFR}
              onClick={() => setFutOuvert(true)}
              title={nomDefinitionDeLindicateur}
            >
              {nomDefinitionDeLindicateur}
            </Accordion.Trigger>
          </h3>
        </Accordion.Header>
        <Accordion.Content
          className={CLASSES_CONTENU_ACCORDEON_DSFR}
          innerClassName={CLASSES_INTERIEUR_ACCORDEON_DSFR}
        >
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
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item
        className={clsxm(CLASSES_ITEM_ACCORDEON_DSFR, "print:hidden")}
        value={`repartition-geographique-et-evolution-${indicateur.id}`}
      >
        <Accordion.Header asChild className={CLASSES_ENTETE_ACCORDEON_DSFR}>
          <h3>
            <Accordion.Trigger
              className={CLASSES_DECLENCHEUR_ACCORDEON_DSFR}
              onClick={() => setFutOuvert(true)}
              title={nomRepartitionGeographiqueEtEvolution}
            >
              {nomRepartitionGeographiqueEtEvolution}
            </Accordion.Trigger>
          </h3>
        </Accordion.Header>
        <Accordion.Content
          className={CLASSES_CONTENU_ACCORDEON_DSFR}
          innerClassName={CLASSES_INTERIEUR_ACCORDEON_DSFR}
        >
          {donnéesCartographieAvancementTerritorialisées ||
          donnéesCartographieValeurAvancementTerritorialisées ||
          (chantierEstTerritorialisé && indicateurDetailsMode === "widget") ? (
            <>
              {futOuvert ? (
                <Suspense>
                  <ComparaisonTerritoiresIndicateur
                    indicateurId={indicateur.id}
                    chantierId={chantierId}
                    jalon={jalon}
                    maille={mailleQuery}
                    territoireCode={territoireCode}
                    unite={indicateur.unité}
                  />
                </Suspense>
              ) : null}
            </>
          ) : (
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

                    <div className="fr-mt-2w fr-container">
                      <Suspense>
                        <ComparaisonTerritoiresIndicateur
                          indicateurId={indicateur.id}
                          chantierId={chantierId}
                          jalon={jalon}
                          maille={mailleQuery}
                          territoireCode={territoireCode}
                          unite={indicateur.unité}
                        />
                      </Suspense>
                    </div>
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
          )}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};
