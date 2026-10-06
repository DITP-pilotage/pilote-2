import { FunctionComponent } from "react";
import {
  Accordion,
  CLASSES_DECLENCHEUR_ACCORDEON_DSFR,
  CLASSES_ENTETE_ACCORDEON_DSFR,
  CLASSES_CONTENU_ACCORDEON_DSFR,
  CLASSES_INTERIEUR_ACCORDEON_DSFR,
  CLASSES_ITEM_ACCORDEON_DSFR,
} from "@/components/shared/Accordion";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { useNouveautés } from "./useNouveautés";

const Nouveautés: FunctionComponent = () => {
  const { listeNouveautes, estChargementListeNouveautes } = useNouveautés();

  return (
    <div className="[&_p]:mb-0 [&_h4]:my-2 [&_hr]:!my-2">
      <main>
        <div className="fr-container fr-pb-2w">
          <div className="fr-grid-row fr-py-4w">
            <Titre baliseHtml="h1" className="fr-my-auto">
              Nouveautés
            </Titre>
          </div>
          {!estChargementListeNouveautes ? (
            <Bloc>
              {!listeNouveautes || listeNouveautes.length === 0 ? (
                <h2 className="fr-h3">Aucune nouveautés sur le projet</h2>
              ) : (
                <>
                  <div className="fr-grid-row">
                    <div className="fr-col-12">
                      <h2 className="fr-h3">
                        Version{" "}
                        {`${listeNouveautes[0].version} du ${new Date(listeNouveautes[0].date).toLocaleDateString("fr-FR")}`}
                      </h2>
                      <div className="fr-mb-2w">
                        <div
                          className="fr-content"
                          dangerouslySetInnerHTML={{
                            __html: listeNouveautes[0].contenu,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {listeNouveautes
                    .slice(1, listeNouveautes.length)
                    .map((element, index) => {
                      return (
                        <div
                          className="fr-grid-row fr-mb-2w fr-mt-2w"
                          key={`nouveauté-${element.date}-${element.id}`}
                        >
                          <div className="fr-col-12">
                            <h2 className="fr-h3">
                              Version{" "}
                              {`${element.version} du ${new Date(element.date).toLocaleDateString("fr-FR")}`}
                            </h2>
                            <Accordion.Root collapsible type="single">
                              <Accordion.Item
                                className={CLASSES_ITEM_ACCORDEON_DSFR}
                                value={`accordion-${index}`}
                              >
                                <Accordion.Header
                                  asChild
                                  className={CLASSES_ENTETE_ACCORDEON_DSFR}
                                >
                                  <h3>
                                    <Accordion.Trigger
                                      className={
                                        CLASSES_DECLENCHEUR_ACCORDEON_DSFR
                                      }
                                    >
                                      Voir le détail
                                    </Accordion.Trigger>
                                  </h3>
                                </Accordion.Header>
                                <Accordion.Content
                                  className={CLASSES_CONTENU_ACCORDEON_DSFR}
                                  innerClassName={
                                    CLASSES_INTERIEUR_ACCORDEON_DSFR
                                  }
                                >
                                  <div
                                    className="fr-content"
                                    dangerouslySetInnerHTML={{
                                      __html: element.contenu,
                                    }}
                                  />
                                </Accordion.Content>
                              </Accordion.Item>
                            </Accordion.Root>
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </Bloc>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Nouveautés;
