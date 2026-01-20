import { FunctionComponent, PropsWithChildren } from "react";
import { FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";

import useModalePropositionValeurAvancementV2, {
  EtapePropositionValeurAvancement,
  Stepper,
} from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/useModalePropositionValeurAvancementV2";
import Input from "@/components/_commons/Input/Input";
import { formaterDate } from "@/client/utils/date/date";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";

export const ModalePropositionValeurAvancementV2: FunctionComponent<
  PropsWithChildren
> = ({ children }) => {
  const utilisateur = useProfilUtilisateurConnecte();
  const auteurModification = `${utilisateur.prenom} ${utilisateur.nom}`;

  const {
    reactHookForm,
    creerPropositonValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    EtapeSuivanteEstDesactive,
    estUneModificationDeProposition,
    optionsMois,
  } = useModalePropositionValeurAvancementV2();

  const refreshRouter = useRefreshRouter();
  const {
    indicateur,
    detailIndicateurDuTerritoire,
    territoireSélectionné: {
      codeInsee: territoireCodeInsee,
      nom: territoireNom,
    },
    configurationFeatureFlipping,
  } = useBlocIndicateurContext();

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
        }
      }}
      title="Proposer une valeur d'avancement"
      titleHidden
      trigger={children}
    >
      {etapePropositionValeurAvancement ? (
        <>
          <div className="fr-stepper fr-mb-1w">
            <h2 className="fr-stepper__title">
              <span>
                {`${Stepper[etapePropositionValeurAvancement].titre}`}
              </span>
              <span className="fr-stepper__state">
                {estUneModificationDeProposition
                  ? `Modifier la proposition de valeur d'avancement - Étape ${Stepper[etapePropositionValeurAvancement].numeroEtape} sur 2`
                  : `Proposer une autre valeur d'avancement - Étape ${Stepper[etapePropositionValeurAvancement].numeroEtape} sur 2`}
              </span>
            </h2>
            <div
              className="fr-stepper__steps"
              data-fr-current-step={
                Stepper[etapePropositionValeurAvancement].numeroEtape
              }
              data-fr-steps="2"
            />
            {Stepper[etapePropositionValeurAvancement].etapeSuivante ? (
              <p className="fr-stepper__details">
                <span className="fr-text--bold">Étape suivante :</span>
                {` ${Stepper[etapePropositionValeurAvancement].etapeSuivante}`}
              </p>
            ) : null}
          </div>
          <FormProvider {...reactHookForm}>
            <form
              method="post"
              onSubmit={reactHookForm.handleSubmit((data) => {
                creerPropositonValeurAvancement(
                  estUneModificationDeProposition,
                  data,
                );
              })}
            >
              {etapePropositionValeurAvancement ===
              EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE ? (
                <>
                  <h2 className="fr-h4">
                    {`${indicateur.id} ${indicateur.nom}`}
                  </h2>
                  <p className="fr-text fr-text--sm fr-mb-1w">
                    {`${territoireCodeInsee} - ${territoireNom}`}
                  </p>
                  <p className="fr-text texte-warning fr-text--xs text-italic fr-mb-2w">
                    *tous les champs sont obligatoires
                  </p>
                  {detailIndicateurDuTerritoire.proposition !== null ? (
                    <p className="fr-text--sm fr-mt-1v">
                      La proposition de nouvelle valeur d'avancement que vous
                      modifiez a été faite par{" "}
                      {detailIndicateurDuTerritoire.proposition.auteur} le{" "}
                      {formaterDate(
                        detailIndicateurDuTerritoire.proposition
                          .dateProposition,
                        "DD/MM/YYYY",
                      )}
                      . Toute modification apportée à cette proposition écrasera
                      et remplacera celle-ci.
                    </p>
                  ) : null}
                  <div className="w-full flex fr-mt-2w">
                    <div className="w-half-full fr-mr-1w border flex flex-column">
                      <span className="fr-background-action-low-blue-france flex justify-center fr-p-1w border">
                        Valeur d'avancement importée par la direction de projet
                      </span>
                      <div className="w-full flex flex-column justify-between fr-pt-1w">
                        <span className="flex justify-center fr-mb-5v">
                          {detailIndicateurDuTerritoire.valeurAvancementMandat?.toLocaleString(
                            "fr-FR",
                          )}
                        </span>
                        <span className="flex justify-center align-end texte-gris">
                          (
                          {formaterDate(
                            detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                            "MM/YYYY",
                          )}
                          )
                        </span>
                      </div>
                    </div>
                    <div className="w-half-full fr-ml-1w border">
                      {estUneModificationDeProposition ? (
                        <span className="fr-background-action-low-blue-france w-full flex justify-center fr-p-1w">
                          {`Valeur d'avancement proposée par ${detailIndicateurDuTerritoire.proposition?.auteur} le ${formaterDate(detailIndicateurDuTerritoire.proposition!.dateProposition, "DD/MM/YYYY")}`}
                          <Infobulle classNameInfoBulle="tooltip-accordeon">
                            <p className="fr-text--sm texte-proposition">
                              Valeur d'avancement proposée le{" "}
                              {formaterDate(
                                detailIndicateurDuTerritoire.proposition
                                  ?.dateProposition,
                                "DD/MM/YYYY",
                              )}{" "}
                              par{" "}
                              {detailIndicateurDuTerritoire.proposition?.auteur}
                            </p>
                            <p className="fr-text--sm">
                              <b>Motif de la proposition</b>
                            </p>
                            <p className="fr-text--sm">
                              {detailIndicateurDuTerritoire.proposition?.motif}
                            </p>
                            <p className="fr-text--sm">
                              <b>Source des données et méthode de calcul</b>
                            </p>
                            <p className="fr-text--sm fr-mb-0">
                              {
                                detailIndicateurDuTerritoire.proposition
                                  ?.sourceDonneeEtMethodeCalcul
                              }
                            </p>
                          </Infobulle>
                        </span>
                      ) : (
                        <span className="fr-background-action-low-blue-france w-full flex justify-center fr-p-1w">
                          Proposition de nouvelle valeur d'avancement
                          <ChampObligatoire />
                        </span>
                      )}
                      <div className="w-full flex flex-column align-center fr-pt-1w">
                        {estUneModificationDeProposition ? (
                          <span className="flex justify-center fr-mb-5v">
                            {
                              detailIndicateurDuTerritoire.proposition
                                ?.valeurAvancement
                            }
                          </span>
                        ) : (
                          <div className="w-half-full flex fr-mb-1w">
                            <Input
                              className="text-center"
                              erreurMessage={
                                reactHookForm.formState.errors.valeurAvancement
                                  ?.message
                              }
                              htmlName="valeurAvancement"
                              register={reactHookForm.register(
                                "valeurAvancement",
                              )}
                              type="text"
                            />
                          </div>
                        )}

                        <span className="flex justify-center texte-gris">
                          ({reactHookForm.watch("moisValeurAvancement")})
                        </span>
                      </div>
                    </div>
                  </div>
                  {configurationFeatureFlipping.pvaValeurDifferente &&
                  !estUneModificationDeProposition ? (
                    <div className="fr-mt-2w">
                      <SelecteurNew
                        erreurMessage={
                          reactHookForm.formState.errors.moisValeurAvancement
                            ?.message
                        }
                        htmlName="moisValeurAvancement"
                        libelle={
                          <>
                            Date de la valeur d'avancement proposée
                            <ChampObligatoire />
                          </>
                        }
                        onChange={(valeur) => {
                          reactHookForm.setValue(
                            "moisValeurAvancement",
                            valeur,
                            {
                              shouldValidate: true,
                            },
                          );
                        }}
                        options={optionsMois}
                        valeurSelectionnee={reactHookForm.watch(
                          "moisValeurAvancement",
                        )}
                      />
                      <span className="flex texte-gris fr-text--xs !mt-1">
                        Dernière date de la valeur d'avancement :
                        {formaterDate(
                          detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                      </span>
                    </div>
                  ) : null}
                  {estUneModificationDeProposition ? (
                    <div className="fr-mt-2w">
                      <label className="fr-label" htmlFor="valeurAvancement">
                        Valeur modifiée
                        <ChampObligatoire />
                      </label>
                      <Input
                        className="fr-mt-1v input--sm"
                        classNameGroupe="fr-mb-1v"
                        erreurMessage={
                          reactHookForm.formState.errors.valeurAvancement
                            ?.message
                        }
                        htmlName="valeurAvancement"
                        register={reactHookForm.register("valeurAvancement")}
                        type="text"
                      />
                      <span className="flex texte-gris fr-text--xs">
                        (
                        {formaterDate(
                          detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </div>
                  ) : null}
                  <div className="fr-mt-2w">
                    <TextAreaAvecLabel
                      compteur={{
                        taille: reactHookForm.watch("motifProposition").length,
                        limite: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      erreurMessage={
                        reactHookForm.formState.errors.motifProposition?.message
                      }
                      htmlName="motifProposition"
                      isRequired
                      libellé="Motif de la proposition"
                      placeholder="Indiquez ici d'où provient la différence entre la valeur actuelle que vous proposez et celle qui a été importée initialement par la direction de projet."
                      register={reactHookForm.register("motifProposition", {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="fr-mt-2w">
                    <TextAreaAvecLabel
                      compteur={{
                        taille: reactHookForm.watch(
                          "sourceDonneeEtMethodeCalcul",
                        ).length,
                        limite: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      erreurMessage={
                        reactHookForm.formState.errors
                          .sourceDonneeEtMethodeCalcul?.message
                      }
                      hauteur="90px"
                      htmlName="sourceDonneeEtMethodeCalcul"
                      isRequired
                      libellé="Sources des données et méthode de calcul"
                      placeholder="Afin de documenter votre proposition, indiquez ici la source de vos données ainsi que la méthode de calcul qui vous a permis d'aboutir à la valeur proposée. Le cas échéant, précisez en quoi cette méthode est différente de celle mise en œuvre par la direction de projet"
                      register={reactHookForm.register(
                        "sourceDonneeEtMethodeCalcul",
                        { required: true },
                      )}
                    />
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn"
                      disabled={EtapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.VALIDATION_VALEUR_ACTUELLE,
                        )
                      }
                      type="button"
                    >
                      Étape suivante
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>
                    Veuillez vérifier si la proposition ci-dessous est correcte
                    et prête pour publication immédiate. Après publication, il
                    vous sera toujours possible de modifier ou de supprimer
                    votre proposition.
                  </span>
                  <div className="fr-callout fr-py-2w fr-mt-2w">
                    <h3 className="fr-callout__title fr-mb-0">
                      {`${indicateur.id} ${indicateur.nom}`}
                    </h3>
                    <p className="fr-text fr-text--sm fr-mb-1w">
                      {`${territoireCodeInsee} - ${territoireNom}`}
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Valeur d'avancement proposée le{" "}
                        {`${formaterDate(new Date().toISOString(), "DD/MM/YYYY")}`}{" "}
                        par {auteurModification} :{" "}
                        {reactHookForm.getValues("valeurAvancement")} (
                        {formaterDate(
                          detailIndicateurDuTerritoire.dateValeurAvancement,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Date de la proposition de valeur d'avancement : 
                      </span>
                      <span className="text-italic">
                        {reactHookForm.getValues("moisValeurAvancement")}
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Motif de la proposition :
                      </span>{" "}
                      <span className="text-italic">
                        {reactHookForm.getValues("motifProposition")}
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Source des données et méthode de calcul :
                      </span>{" "}
                      <span className="text-italic">
                        {reactHookForm.getValues("sourceDonneeEtMethodeCalcul")}
                      </span>
                    </p>
                  </div>
                  <div className="fr-alert fr-alert--info">
                    <h3 className="fr-alert__title">
                      Rappel sur le statut de votre proposition
                    </h3>
                    <p>
                      Nous vous rappelons que la valeur d'avancement que vous
                      proposez ne sera pas prise en compte dans le calcul du
                      taux d'avancement global du chantier. Cette proposition
                      vise à engager un dialogue avec la direction de projet au
                      niveau national, qui en sera informée.
                    </p>
                    <p>
                      Si votre proposition n'est pas intégrée par la direction
                      de projet, elle ne sera plus visible dans l'historique de
                      l'indicateur à la prochaine mise à jour. Elle sera
                      cependant conservée dans la base de données de PILOTE.
                    </p>
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn fr-btn--secondary fr-mr-2w"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE,
                        )
                      }
                      type="button"
                    >
                      Étape précédente
                    </button>
                    <button className="fr-btn" type="submit">
                      Publier la proposition
                    </button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <div className="fr-alert fr-alert--success fr-mt-2w">
          {!estUneModificationDeProposition ? (
            <>
              <h3 className="fr-alert__title">
                La proposition de valeur d'avancement a correctement été prise
                en compte
              </h3>
              <span>
                La proposition de valeur d'avancement sera affiché dans le
                tableau des indicateurs. Le taux d'avancement correspondant sera
                pris en compte dans un délai maximal de deux heures.
              </span>
            </>
          ) : (
            <>
              <h3 className="fr-alert__title">
                La nouvelle proposition de valeur d'avancement a correctement
                été prise en compte
              </h3>
              <span>
                La nouvelle proposition de valeur d'avancement sera affiché dans
                le tableau des indicateurs. Le taux d'avancement correspondant
                sera pris en compte dans un délai maximal de deux heures.
              </span>
            </>
          )}
        </div>
      )}
    </Modale>
  );
};
