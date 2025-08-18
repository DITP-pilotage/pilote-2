import { FunctionComponent, useState } from "react";
import { FormProvider } from "react-hook-form";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

import {
  EtapePropositionValeurAvancement,
  Stepper,
  useModaleAccepterPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/useModaleAccepterPropositionValeurAvancement";
import Input from "@/components/_commons/Input/Input";
import { formaterDate } from "@/client/utils/date/date";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";

export const ModaleAccepterPropositionValeurAvancement: FunctionComponent<{
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  generatedHTMLID: string;
  territoireCode: string;
  territoireCodeInsee: string;
  territoireNom: string;
}> = ({
  indicateur,
  detailIndicateur,
  generatedHTMLID,
  territoireCode,
  territoireCodeInsee,
  territoireNom,
}) => {
  const {
    reactHookForm,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    EtapeSuivanteEstDesactive,
    accepterPropositonValeurAvancement,
  } = useModaleAccepterPropositionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  const [decision, setDecision] = useState<
    "accepter" | "accepter-avec-modification" | "refuser"
  >("accepter");

  return (
    <Modale idHtml={generatedHTMLID} tailleModale="lg">
      {etapePropositionValeurAvancement ? (
        <>
          <div className="fr-stepper fr-mb-1w">
            <h2 className="fr-stepper__title">
              <span>
                {`${Stepper[etapePropositionValeurAvancement].titre}`}
              </span>
              <span className="fr-stepper__state">
                {`Prendre une décision - Étape ${Stepper[etapePropositionValeurAvancement].numeroEtape} sur 2`}
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
                accepterPropositonValeurAvancement(data);
              })}
            >
              {etapePropositionValeurAvancement ===
              EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION ? (
                <>
                  <h2 className="fr-h4">
                    {`${indicateur.id} ${indicateur.nom}`}
                  </h2>
                  <p className="fr-text fr-text--sm fr-mb-1w">
                    {`${territoireCodeInsee} - ${territoireNom}`}
                  </p>
                  {detailIndicateur.proposition !== null ? (
                    <p className="fr-text--sm fr-mt-1v">
                      La proposition de nouvelle valeur d'avancement que vous
                      modifiez a été faite par{" "}
                      {detailIndicateur.proposition.auteur} le{" "}
                      {formaterDate(
                        detailIndicateur.proposition.dateProposition,
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
                          {detailIndicateur.valeurAvancementMandat?.toLocaleString(
                            "fr-FR",
                          )}
                        </span>
                        <span className="flex justify-center align-end texte-gris">
                          (
                          {formaterDate(
                            detailIndicateur.dateValeurAvancementMandat,
                            "MM/YYYY",
                          )}
                          )
                        </span>
                      </div>
                    </div>
                    <div className="w-half-full fr-ml-1w border">
                      <span className="fr-background-action-low-blue-france w-full flex justify-center fr-p-1w">
                        Proposition de nouvelle valeur d'avancement
                        <ChampObligatoire />
                      </span>
                      <div className="w-full flex flex-column align-center fr-pt-1w">
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
                        <span className="flex justify-center texte-gris">
                          (
                          {formaterDate(
                            detailIndicateur.dateValeurAvancementMandat,
                            "MM/YYYY",
                          )}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="fr-text--sm fr-mt-2w">
                    Indiquez la décision que vous souhaitez prendre concernant
                    cette proposition :
                  </p>
                  <div className="fr-fieldset__element">
                    <div className="fr-radio-group">
                      <input
                        checked={decision === "accepter"}
                        id="accepter"
                        name="decision"
                        onChange={() => setDecision("accepter")}
                        type="radio"
                      />
                      <label className="fr-label" htmlFor="accepter">
                        accepter la proposition
                      </label>
                    </div>
                  </div>
                  <div className="fr-fieldset__element">
                    <div className="fr-radio-group">
                      <input
                        checked={decision === "accepter-avec-modification"}
                        id="accepter-avec-modification"
                        name="decision"
                        onChange={() =>
                          setDecision("accepter-avec-modification")
                        }
                        type="radio"
                      />
                      <label
                        className="fr-label"
                        htmlFor="accepter-avec-modification"
                      >
                        accepter la proposition avec modification
                      </label>
                      <label
                        className="fr-label fr-text--xs texte-gris fr-pl-4w"
                        htmlFor="accepter-avec-modification"
                      >
                        Le cas échéant, veuillez renseigner dans le tableau
                        ci-dessous la valeur modifiée que vous souhaitez valider
                        pour cet indicateur* :
                      </label>

                      <label
                        className="fr-label fr-text--xs texte-gris fr-pl-4w"
                        htmlFor="accepter-avec-modification"
                      >
                        *ce champ est obligatoire
                      </label>
                    </div>
                    <div className="fr-mt-2w">
                      <Input
                        className="fr-mt-1v input--sm"
                        classNameGroupe="fr-mb-1v"
                        disabled={decision !== "accepter-avec-modification"}
                        erreurMessage={
                          reactHookForm.formState.errors.valeurAvancement
                            ?.message
                        }
                        htmlName="valeurAvancementModifiee"
                        register={reactHookForm.register("valeurAvancement")}
                        type="text"
                      />
                      <span className="flex texte-gris fr-text--xs">
                        (
                        {formaterDate(
                          detailIndicateur.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </div>
                  </div>

                  <div className="fr-fieldset__element">
                    <div className="fr-radio-group">
                      <input
                        checked={decision === "refuser"}
                        id="refuser"
                        name="decision"
                        onChange={() => setDecision("refuser")}
                        type="radio"
                      />
                      <label className="fr-label" htmlFor="refuser">
                        refuser la proposition
                      </label>
                    </div>
                  </div>

                  <div className="fr-mt-2w">
                    <TextAreaAvecLabel
                      erreurMessage={
                        reactHookForm.formState.errors.motifProposition?.message
                      }
                      htmlName="motifProposition"
                      isRequired={decision === "refuser"}
                      libellé={
                        decision === "refuser"
                          ? "Motif de la proposition"
                          : "Motif de la proposition (Facultatif)"
                      }
                      placeholder="Indiquez ici les raisons qui motivent votre choix."
                      register={reactHookForm.register("motifProposition", {
                        required: decision === "refuser",
                      })}
                    />
                  </div>

                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn"
                      disabled={EtapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.VALIDATION_DECISION,
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
                          detailIndicateur.dateValeurAvancement,
                          "MM/YYYY",
                        )}
                        )
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
                      niveau national, qui en sera informée. Si votre
                      proposition n'est pas intégrée par la direction de projet,
                      elle ne sera plus visible dans l'historique de
                      l'indicateur à la prochaine mise à jour. Elle sera
                      cependant conservée dans la base de données de PILOTE.
                    </p>
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn fr-btn--secondary fr-mr-2w"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION,
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
                La proposition de valeur d'avancement s'affichera dans le
                tableau des indicateurs dans une heure. Veuillez noter que, dans
                cet intervalle, il n'est pas possible de faire une autre
                proposition pour cet indicateur.
              </span>
            </>
          ) : (
            <>
              <h3 className="fr-alert__title">
                La nouvelle proposition de valeur d'avancement a correctement
                été prise en compte
              </h3>
              <span>
                La nouvelle proposition de valeur d'avancement s'affichera dans
                le tableau des indicateurs dans une heure. Veuillez noter que,
                dans cet intervalle, il n'est pas possible de faire une autre
                proposition pour cet indicateur.
              </span>
            </>
          )}
        </div>
      )}
    </Modale>
  );
};
