import { FunctionComponent, PropsWithChildren } from "react";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField, TextareaField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Callout } from "@/components/shared/Callout";
import { Controller, FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";

import {
  EtapePropositionValeurAvancement,
  LIMIT_CARACTERES_MOTIF,
  Stepper,
  useModaleAccepterPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/useModaleAccepterPropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import { ComparaisonValeurBox } from "@/components/_commons/IndicateursChantier/Bloc/ComparaisonValeurBox";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
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
    isPending,
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
          <StepIndicator
            className="mb-2"
            currentStep={Stepper[etapePropositionValeurAvancement].numeroEtape}
            label="Prendre une décision"
            nextStep={Stepper[etapePropositionValeurAvancement].etapeSuivante}
            stepCount={2}
            title={Stepper[etapePropositionValeurAvancement].titre}
          />
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
                      <NomUtilisateurAvecTooltip
                        nom={detailIndicateur.proposition.auteur!}
                        service={detailIndicateur.proposition.auteurService}
                        fonction={detailIndicateur.proposition.auteurFonction}
                      />{" "}
                      le{" "}
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
                      titre={
                        <span>
                          {`Valeur d'avancement proposée par `}
                          <NomUtilisateurAvecTooltip
                            nom={detailIndicateur.proposition!.auteur!}
                            service={
                              detailIndicateur.proposition?.auteurService ??
                              null
                            }
                            fonction={
                              detailIndicateur.proposition?.auteurFonction ??
                              null
                            }
                          />
                          {` le ${formaterDate(detailIndicateur.proposition?.dateProposition, "DD/MM/YYYY")}`}
                        </span>
                      }
                      valeur={detailIndicateur.proposition?.valeurAvancement}
                    />
                  </div>
                  <p className="fr-text--sm fr-mt-2w fr-mb-1w">
                    Indiquez la décision que vous souhaitez prendre concernant
                    cette proposition :
                  </p>
                  <Controller
                    control={reactHookForm.control}
                    name="decision"
                    render={({ field }) => (
                      <RadioGroup.Root
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <RadioGroup.Item
                          id="accepter"
                          libelle="accepter la proposition"
                          value="accepter"
                        />
                        <div className="flex flex-col gap-2">
                          <RadioGroup.Item
                            aide="Le cas échéant, veuillez renseigner dans le tableau ci-dessous la valeur modifiée que vous souhaitez valider pour cet indicateur* :"
                            id="accepter-avec-modification"
                            libelle="accepter la proposition avec modification"
                            value="accepter-avec-modification"
                          />
                          <div className="pl-8">
                            <p className="fr-text texte-warning fr-text--xs text-italic">
                              *ce champ est obligatoire
                            </p>
                            <TextField
                              className="mb-1"
                              disabled={
                                reactHookForm.watch("decision") !==
                                "accepter-avec-modification"
                              }
                              errorMessage={
                                reactHookForm.formState.errors
                                  .valeurModification?.message
                              }
                              id="valeurModification"
                              type="number"
                              inputClassName="py-1 text-sm w-auto"
                              {...reactHookForm.register("valeurModification")}
                            />
                            <span className="flex texte-gris fr-text--xs">
                              (
                              {formaterDate(
                                detailIndicateur.proposition
                                  ?.dateValeurAvancement,
                                "MM/YYYY",
                              )}
                              )
                            </span>
                          </div>
                        </div>
                        <RadioGroup.Item
                          id="refuser"
                          libelle="refuser la proposition"
                          value="refuser"
                        />
                      </RadioGroup.Root>
                    )}
                  />

                  <div className="fr-mt-2w">
                    <TextareaField
                      className={FIELD_GROUP_SPACING}
                      counter={{
                        length: reactHookForm.watch("motif").length,
                        max: LIMIT_CARACTERES_MOTIF,
                      }}
                      errorMessage={
                        reactHookForm.formState.errors.motif?.message
                      }
                      id="motif"
                      required={decision !== "accepter"}
                      label={
                        decision === "accepter"
                          ? "Motif de la décision (Facultatif)"
                          : "Motif de la décision"
                      }
                      placeholder="Indiquez ici les raisons qui motivent votre choix."
                      textareaClassName="resize-none"
                      {...reactHookForm.register("motif")}
                    />
                  </div>

                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="primary"
                      disabled={EtapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.VALIDATION_DECISION,
                        )
                      }
                      type="button"
                    >
                      Étape suivante
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span>
                    Veuillez vérifier si la synthèse ci-dessous est conforme à
                    votre décision et prête pour publication immédiate.
                  </span>
                  <Callout.Root className="mt-4 px-6 py-4" color="highlight">
                    <Callout.Text>
                      <Callout.Title>
                        {`${indicateur.id} ${indicateur.nom}`}
                      </Callout.Title>
                      <p className="fr-text fr-text--sm fr-mb-1w">
                        {`${territoireCodeInsee} - ${territoireNom}`}
                      </p>
                      <p className="fr-text--sm mb-0">
                        <span>
                          Valeur d'avancement proposée le{" "}
                          {`${formaterDate(detailIndicateur.proposition?.dateProposition, "DD/MM/YYYY")}`}{" "}
                          par{" "}
                          <NomUtilisateurAvecTooltip
                            nom={detailIndicateur.proposition!.auteur!}
                            service={
                              detailIndicateur.proposition?.auteurService ??
                              null
                            }
                            fonction={
                              detailIndicateur.proposition?.auteurFonction ??
                              null
                            }
                          />{" "}
                          :{" "}
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
                      <p className="fr-text--sm mb-0">
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
                      <p className="fr-text--sm mb-0">
                        <span>Motif de la décision :</span>{" "}
                        <span className="text-italic">
                          {reactHookForm.getValues("motif") ||
                            "Aucun motif n'a été apporté"}
                        </span>
                      </p>
                    </Callout.Text>
                  </Callout.Root>
                  <Alerte type="info">
                    <h3>
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
                  </Alerte>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="secondary"
                      className="mr-4"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION,
                        )
                      }
                      type="button"
                    >
                      Étape précédente
                    </Button>
                    <Button
                      variant="primary"
                      disabled={isPending}
                      type="submit"
                    >
                      {isPending
                        ? "Traitement en cours..."
                        : decision === "refuser"
                          ? "Valider la décision"
                          : decision === "accepter-avec-modification"
                            ? "Accepter avec modification"
                            : "Accepter la proposition"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <Alerte type="succès" classesSupplementaires="fr-mt-2w">
          <h3>
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
        </Alerte>
      )}
    </Modale>
  );
};
