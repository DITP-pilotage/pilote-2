import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import { EditeurRiche } from "@/components/_commons/ÉditeurRiche/EditeurRiche";
import { useNouveautés } from "./useNouveautés";
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";
import "@gouvfr/dsfr/dist/component/input/input.min.css";
import { NouveautésStyled } from "./Nouveautés.styled";

const Nouveautés: FunctionComponent<{
  estAutoriseAModifierLesNouveautés: boolean;
}> = ({ estAutoriseAModifierLesNouveautés }) => {
  const {
    sauvegarderContenuNouveautés,
    modifierContenuNouveautés,
    listeNouveautes,
    estChargementListeNouveautes,
    contenu,
    estUnModeEdition,
    idAModifier,
    version,
    date,
    setContenu,
    setVersion,
    setDate,
    setEstUnModeEdition,
    setIdAModifier,
  } = useNouveautés();

  return (
    <NouveautésStyled>
      <main>
        <div className="fr-container fr-pb-2w">
          <div className="fr-grid-row fr-py-4w">
            <Titre baliseHtml="h1" className="fr-my-auto">
              Nouveautés
            </Titre>
          </div>
          {!estChargementListeNouveautes ? (
            <Bloc>
              <div className="fr-grid-row">
                {estAutoriseAModifierLesNouveautés ? (
                  estUnModeEdition && !idAModifier ? (
                    <>
                      <div className="fr-col-12">
                        <div className="fr-grid-row fr-grid-row--gutters">
                          <div className="fr-col-6">
                            <input
                              className="fr-input"
                              onChange={(e) => setVersion(e.target.value)}
                              type="text"
                              value={version}
                            />
                          </div>
                          <div className="fr-col-6">
                            <input
                              className="fr-input"
                              onChange={(e) => setDate(e.target.value)}
                              type="date"
                              value={date}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="fr-col-12 fr-mb-2w">
                        <EditeurRiche
                          contenu={contenu}
                          onChange={setContenu}
                          placeholder="Saisissez les nouvelles fonctionnalités..."
                        />
                      </div>
                      <div className="fr-col-12 fr-mb-2w flex justify-end">
                        <button
                          className="fr-btn fr-mr-2w"
                          onClick={() => setEstUnModeEdition(false)}
                          type="button"
                        >
                          Annuler
                        </button>
                        <button
                          className="fr-btn"
                          onClick={() =>
                            sauvegarderContenuNouveautés({
                              contenu,
                              version,
                              date,
                            })
                          }
                          type="button"
                        >
                          Sauvegarder
                        </button>
                      </div>
                    </>
                  ) : !idAModifier ? (
                    <div className="fr-col-12 fr-my-2w flex justify-end">
                      <button
                        className="fr-btn"
                        onClick={() => setEstUnModeEdition(true)}
                        type="button"
                      >
                        Créer une nouveauté
                      </button>
                    </div>
                  ) : null
                ) : null}
              </div>
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
                        {estAutoriseAModifierLesNouveautés &&
                        listeNouveautes[0].id === idAModifier ? (
                          <EditeurRiche
                            contenu={listeNouveautes[0].contenu}
                            onChange={setContenu}
                            placeholder="Saisissez les nouvelles fonctionnalités..."
                          />
                        ) : (
                          <div
                            className="fr-content"
                            dangerouslySetInnerHTML={{
                              __html: listeNouveautes[0].contenu,
                            }}
                          />
                        )}
                        <div className="fr-mt-2w flex justify-end">
                          {estAutoriseAModifierLesNouveautés &&
                          listeNouveautes[0].id !== idAModifier ? (
                            <button
                              className="fr-btn"
                              onClick={() =>
                                setIdAModifier(listeNouveautes[0].id)
                              }
                              type="button"
                            >
                              Modifier
                            </button>
                          ) : estAutoriseAModifierLesNouveautés &&
                            listeNouveautes[0].id === idAModifier ? (
                            <>
                              <button
                                className="fr-btn fr-mr-2w"
                                onClick={() => setIdAModifier("")}
                                type="button"
                              >
                                Annuler
                              </button>
                              <button
                                className="fr-btn"
                                onClick={() =>
                                  modifierContenuNouveautés({
                                    id: listeNouveautes[0].id,
                                    contenu,
                                    version,
                                    date,
                                  })
                                }
                                type="button"
                              >
                                Sauvegarder
                              </button>
                            </>
                          ) : null}
                        </div>
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
                                  {estAutoriseAModifierLesNouveautés &&
                                  element.id === idAModifier ? (
                                    <EditeurRiche
                                      contenu={element.contenu}
                                      onChange={setContenu}
                                      placeholder="Saisissez les nouvelles fonctionnalités..."
                                    />
                                  ) : (
                                    <div
                                      className="fr-content"
                                      dangerouslySetInnerHTML={{
                                        __html: element.contenu,
                                      }}
                                    />
                                  )}
                                  <div className="fr-mt-2w flex justify-end">
                                    {estAutoriseAModifierLesNouveautés &&
                                    element.id !== idAModifier ? (
                                      <button
                                        className="fr-btn"
                                        onClick={() =>
                                          setIdAModifier(element.id)
                                        }
                                        type="button"
                                      >
                                        Modifier
                                      </button>
                                    ) : estAutoriseAModifierLesNouveautés &&
                                      element.id === idAModifier ? (
                                      <>
                                        <button
                                          className="fr-btn fr-mr-2w"
                                          onClick={() => setIdAModifier("")}
                                          type="button"
                                        >
                                          Annuler
                                        </button>
                                        <button
                                          className="fr-btn"
                                          onClick={() =>
                                            modifierContenuNouveautés({
                                              id: element.id,
                                              contenu,
                                              version,
                                              date,
                                            })
                                          }
                                          type="button"
                                        >
                                          Sauvegarder
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
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
    </NouveautésStyled>
  );
};

export default Nouveautés;
