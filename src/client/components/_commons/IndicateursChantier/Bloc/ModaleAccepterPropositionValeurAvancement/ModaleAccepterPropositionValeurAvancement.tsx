import { FunctionComponent } from "react";
import { FormProvider } from "react-hook-form";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

import {
  EtapePropositionValeurAvancement,
  Stepper,
  useModaleAccepterPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/useModaleAccepterPropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import { ChampObligatoire } from "@/components/PageIndicateur/ChampObligatoire";
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
    etapeSuivanteEstDesactive: EtapeSuivanteEstDesactive,
    traiterDecision,
  } = useModaleAccepterPropositionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  const decision = reactHookForm.watch("decision");

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
              onChange={() => {
                reactHookForm.trigger();
              }}
              onSubmit={reactHookForm.handleSubmit((data) => {
                traiterDecision(data);
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
                          <span>
                            {detailIndicateur.proposition?.valeurAvancement}
                          </span>
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
                        {...reactHookForm.register("decision")}
                        id="accepter"
                        type="radio"
                        value="accepter"
                      />
                      <label className="fr-label" htmlFor="accepter">
                        accepter la proposition
                      </label>
                    </div>
                  </div>
                  <div className="fr-fieldset__element">
                    <div className="fr-radio-group">
                      <input
                        {...reactHookForm.register("decision")}
                        disabled
                        id="accepter-avec-modification"
                        type="radio"
                        value="accepter-avec-modification"
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
                      <span>Valeur à modifier</span>
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
                        {...reactHookForm.register("decision")}
                        id="refuser"
                        type="radio"
                        value="refuser"
                      />
                      <label className="fr-label" htmlFor="refuser">
                        refuser la proposition
                      </label>
                    </div>
                  </div>

                  <div className="fr-mt-2w">
                    <TextAreaAvecLabel
                      erreurMessage={
                        reactHookForm.formState.errors.motif?.message
                      }
                      htmlName="motif"
                      isRequired={decision === "refuser"}
                      libellé={
                        decision === "refuser"
                          ? "Motif de la décision"
                          : "Motif de la décision (Facultatif)"
                      }
                      placeholder="Indiquez ici les raisons qui motivent votre choix."
                      register={reactHookForm.register("motif")}
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
                    Veuillez vérifier si la synthèse ci-dessous est conforme à
                    votre décision et prête pour publication immédiate.
                  </span>
                  <div className="fr-callout fr-py-2w fr-mt-2w">
                    <h3 className="fr-callout__title fr-mb-0">
                      {`${indicateur.id} ${indicateur.nom}`}
                    </h3>
                    <p className="fr-text fr-text--sm fr-mb-1w">
                      {`${territoireCodeInsee} - ${territoireNom}`}
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span>
                        Valeur d'avancement proposée le{" "}
                        {`${formaterDate(new Date().toISOString(), "DD/MM/YYYY")}`}{" "}
                        par {auteurModification} :{" "}
                      </span>
                      <span className="fr-text--bold">
                        {detailIndicateur.proposition?.valeurAvancement} (
                        {formaterDate(
                          detailIndicateur.dateValeurAvancement,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      Décision : la proposition est{" "}
                      <span className="fr-text--bold">
                        {decision === "refuser" ? "refusée" : "acceptée"}
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Motif de la décision :
                      </span>{" "}
                      <span className="text-italic">
                        {reactHookForm.getValues("motif")}
                      </span>
                    </p>
                  </div>
                  <div className="fr-alert fr-alert--info">
                    <h3 className="fr-alert__title">
                      {decision === "refuser"
                        ? "Refus de la proposition : ce que cela implique"
                        : "Acceptation de la proposition : ce que cela implique"}
                    </h3>
                    <p>
                      {decision === "refuser"
                        ? "La valeur d'avancement de cet indicateur ainsi que le taux d'avancement du chantier sont inchangés."
                        : "La valeur d'avancement de cet indicateur est mise à jour à partir de la valeur proposée. Elle est prise en compte dans le calcul du taux d'avancement global du chantier."}
                    </p>
                    <p>
                      La proposition ainsi que votre décision sont archivées
                      dans l'historique de l'indicateur. Le territoire sera
                      informé de votre décision et pourra, le cas échéant, faire
                      de nouvelles propositions pour cet indicateur.
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
                      {decision === "refuser"
                        ? "Valider la décision"
                        : "Accepter la proposition"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <div className="fr-alert fr-alert--success fr-mt-2w">
          <h3 className="fr-alert__title">
            {decision === "refuser"
              ? "La proposition de valeur d'avancement a bien été refusée"
              : "La nouvelle proposition de valeur d'avancement a correctement été prise en compte"}
          </h3>
          <span>
            {decision === "refuser"
              ? "La valeur d'avancement de cet indicateur est inchangée."
              : "La nouvelle proposition de valeur d'avancement s'affichera dans le tableau des indicateurs dans une heure. Veuillez noter que, dans cet intervalle, il n'est pas possible de faire une autre proposition pour cet indicateur."}
          </span>
        </div>
      )}
    </Modale>
  );
};
