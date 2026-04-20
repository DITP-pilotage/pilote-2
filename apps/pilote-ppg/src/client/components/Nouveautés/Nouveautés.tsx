import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { useNouveautés } from "./useNouveautés";
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";

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
                            <section className="fr-accordion">
                              <h3 className="fr-accordion__title">
                                <button
                                  aria-controls={`accordion-${index}`}
                                  aria-expanded="false"
                                  className="fr-accordion__btn"
                                  type="button"
                                >
                                  Voir le détail
                                </button>
                              </h3>
                              <div
                                className="fr-collapse"
                                id={`accordion-${index}`}
                              >
                                <div className="fr-mb-2w">
                                  <div
                                    className="fr-content"
                                    dangerouslySetInnerHTML={{
                                      __html: element.contenu,
                                    }}
                                  />
                                </div>
                              </div>
                            </section>
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
