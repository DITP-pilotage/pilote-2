import { FunctionComponent, PropsWithChildren } from "react";
import { FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

import {
  EtapePropositionValeurAvancement,
  LIMIT_CARACTERES_MOTIF,
  Stepper,
  useModaleAccepterPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/useModaleAccepterPropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";
import Input from "@/components/_commons/Input/Input";
import { ComparaisonValeurBox } from "@/components/_commons/IndicateursChantier/Bloc/ComparaisonValeurBox";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const ModaleAccepterPropositionValeurAvancement: FunctionComponent<
  PropsWithChildren<{
    indicateur: Indicateur;
    detailIndicateur: DétailsIndicateur;
    territoireCode: string;
    territoireCodeInsee: string;
    territoireNom: string;
  }>
> = ({
  indicateur,
  detailIndicateur,
  territoireCode,
  territoireCodeInsee,
  territoireNom,
  children,
}) => {
  const {
    reactHookForm,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    etapeSuivanteEstDesactive: EtapeSuivanteEstDesactive,
    traiterDecision,
  } = useModaleAccepterPropositionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  const refreshRouter = useRefreshRouter();
  const decision = reactHookForm.watch("decision");

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
        }
      }}
      title="Prendre une décision"
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
                    <ComparaisonValeurBox
                      date={detailIndicateur.dateValeurAvancementMandat}
                      titre="Valeur d'avancement importée par la direction de projet"
                      valeur={detailIndicateur.valeurAvancementMandat?.toLocaleString(
                        "fr-FR",
                      )}
                    />
                    <ComparaisonValeurBox
                      date={detailIndicateur.proposition!.dateValeurAvancement}
                      indicateurId={indicateur.id}
                      proposition={detailIndicateur.proposition}
                      titre={`Valeur d'avancement proposée par ${detailIndicateur.proposition?.auteur} le ${formaterDate(
                        detailIndicateur.proposition?.dateProposition,
                        "DD/MM/YYYY",
                      )}`}
                      valeur={detailIndicateur.proposition?.valeurAvancement}
                    />
                  </div>
                  <p className="fr-text--sm fr-mt-2w fr-mb-1w">
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
                    </div>
                    <div className="fr-pl-4w">
                      <p className="fr-text texte-warning fr-text--xs text-italic">
                        *ce champ est obligatoire
                      </p>
                      <Input
                        className="fr-input--sm !w-auto"
                        classNameGroupe="fr-mb-1v"
                        disabled={
                          reactHookForm.watch("decision") !==
                          "accepter-avec-modification"
                        }
                        erreurMessage={
                          reactHookForm.formState.errors.valeurModification
                            ?.message
                        }
                        htmlName="valeurModification"
                        register={reactHookForm.register("valeurModification")}
                        type="number"
                      />
                      <span className="flex texte-gris fr-text--xs">
                        (
                        {formaterDate(
                          detailIndicateur.proposition?.dateValeurAvancement,
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
                      compteur={{
                        taille: reactHookForm.watch("motif").length,
                        limite: LIMIT_CARACTERES_MOTIF,
                      }}
                      erreurMessage={
                        reactHookForm.formState.errors.motif?.message
                      }
                      htmlName="motif"
                      isRequired={decision !== "accepter"}
                      libellé={
                        decision === "accepter"
                          ? "Motif de la décision (Facultatif)"
                          : "Motif de la décision"
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
                        {`${formaterDate(detailIndicateur.proposition?.dateProposition, "DD/MM/YYYY")}`}{" "}
                        par {detailIndicateur.proposition?.auteur} :{" "}
                      </span>
                      <span className="fr-text--bold">
                        {detailIndicateur.proposition?.valeurAvancement} (
                        {formaterDate(
                          detailIndicateur.proposition?.dateValeurAvancement,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      Décision : la proposition est{" "}
                      {decision === "refuser" ? (
                        <span className="fr-text--bold">refusée</span>
                      ) : decision === "accepter-avec-modification" ? (
                        <>
                          <span>la proposition est </span>
                          <span className="fr-text--bold">modifiée </span>
                          <span>avec la valeur </span>
                          <span className="fr-text--bold">
                            {reactHookForm.getValues("valeurModification")} (
                            {formaterDate(
                              detailIndicateur.dateValeurAvancement,
                              "MM/YYYY",
                            )}
                            )
                          </span>
                        </>
                      ) : (
                        <span className="fr-text--bold">acceptée</span>
                      )}
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span>Motif de la décision :</span>{" "}
                      <span className="text-italic">
                        {reactHookForm.getValues("motif") ||
                          "Aucun motif n'a été apporté"}
                      </span>
                    </p>
                  </div>
                  <div className="fr-alert fr-alert--info">
                    <h3 className="fr-alert__title">
                      {decision === "refuser"
                        ? "Refus de la proposition : ce que cela implique"
                        : decision === "accepter-avec-modification"
                          ? "Acceptation avec modification de la proposition : ce que cela implique"
                          : "Acceptation de la proposition : ce que cela implique"}
                    </h3>
                    <p>
                      {decision === "refuser"
                        ? "La valeur d'avancement de cet indicateur ainsi que le taux d'avancement du chantier sont inchangés."
                        : decision === "accepter-avec-modification"
                          ? "La valeur d'avancement de cet indicateur est mise à jour à partir de la valeur modifiée. Elle est prise en compte dans le calcul du taux d'avancement global du chantier. L'ensemble de ces informations seront visibles dans PILOTE d'ici une heure."
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
                        : decision === "accepter-avec-modification"
                          ? "Accepter avec modification"
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
              : decision === "accepter"
                ? "La proposition de valeur d'avancement a bien été acceptée"
                : "La proposition de valeur d'avancement a bien été acceptée avec modification"}
          </h3>
          <span>
            {decision === "refuser"
              ? "La valeur d'avancement de cet indicateur est inchangée."
              : "La nouvelle valeur d'avancement sera importée et s'affichera dans le tableau des indicateurs dans un délai maximal de deux heures."}
          </span>
        </div>
      )}
    </Modale>
  );
};
