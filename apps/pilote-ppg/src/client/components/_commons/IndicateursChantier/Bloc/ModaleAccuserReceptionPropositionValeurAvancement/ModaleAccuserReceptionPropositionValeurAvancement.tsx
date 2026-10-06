import { FunctionComponent, PropsWithChildren } from "react";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextareaField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Callout } from "@/components/shared/Callout";
import { FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";

import {
  EtapeAccuserReception,
  Stepper,
  useModaleAccuserReceptionPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/useModaleAccuserReceptionPropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import { ComparaisonValeurBox } from "@/components/_commons/IndicateursChantier/Bloc/ComparaisonValeurBox";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const ModaleAccuserReceptionPropositionValeurAvancement: FunctionComponent<
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
    etapeAccuserReception,
    setEtapeAccuserReception,
    etapeSuivanteEstDesactive,
    traiterAccuseReception,
    isPending,
  } = useModaleAccuserReceptionPropositionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });
  const refreshRouter = useRefreshRouter();

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
        }
      }}
      title="Accuser réception"
      titleHidden
      trigger={children}
    >
      {etapeAccuserReception ? (
        <>
          <div className="fr-stepper fr-mb-1w">
            <h2 className="fr-stepper__title">
              <span>{`${Stepper[etapeAccuserReception].titre}`}</span>
              <span className="fr-stepper__state">
                {`Accuser réception - Étape ${Stepper[etapeAccuserReception].numeroEtape} sur 2`}
              </span>
            </h2>
            <div
              className="fr-stepper__steps"
              data-fr-current-step={Stepper[etapeAccuserReception].numeroEtape}
              data-fr-steps="2"
            />
            {Stepper[etapeAccuserReception].etapeSuivante ? (
              <p className="fr-stepper__details">
                <span className="fr-text--bold">Étape suivante :</span>
                {` ${Stepper[etapeAccuserReception].etapeSuivante}`}
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
                traiterAccuseReception(data);
              })}
            >
              {etapeAccuserReception ===
              EtapeAccuserReception.EXAMEN_PROPOSITION ? (
                <>
                  <h2 className="fr-h4">
                    {`${indicateur.id} ${indicateur.nom}`}
                  </h2>
                  <p className="fr-text fr-text--sm fr-mb-1w">
                    {`${territoireCodeInsee} - ${territoireNom}`}
                  </p>

                  <div className="w-full flex fr-mt-2w gap-2">
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

                  <p className="fr-text--sm fr-mt-2w">
                    En accusant réception, vous informez le territoire que vous
                    avez pris connaissance de sa proposition.
                  </p>
                  <p className="fr-text--sm">
                    Afin de favoriser le dialogue avec le territoire, nous vous
                    invitons à partager ci-dessous toutes les informations qui
                    peuvent vous être nécessaires afin de prendre une décision
                    sur cette proposition (facultatif) :
                  </p>

                  <div className="fr-mt-2w">
                    <TextareaField
                      className={FIELD_GROUP_SPACING}
                      counter={{
                        length: reactHookForm.watch("motif").length,
                        max: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      errorMessage={
                        reactHookForm.formState.errors.motif?.message
                      }
                      id="motif"
                      label="Indiquez ici les raisons qui motivent votre choix."
                      placeholder="Indiquez ici les raisons qui motivent votre choix."
                      textareaClassName="resize-none"
                      {...reactHookForm.register("motif")}
                    />
                  </div>

                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="primary"
                      disabled={etapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapeAccuserReception(
                          EtapeAccuserReception.VALIDATION_ACCUSE_RECEPTION,
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
                    Vous vous apprêtez à accuser réception de la proposition
                    suivante :
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
                          {formaterDate(
                            detailIndicateur.proposition?.dateProposition,
                            "DD/MM/YYYY",
                          )}{" "}
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
                      {reactHookForm.getValues("motif") && (
                        <p className="fr-text--sm mb-0">
                          <span className="fr-text--bold">
                            Informations complémentaires :
                          </span>{" "}
                          <span className="text-italic">
                            {reactHookForm.getValues("motif")}
                          </span>
                        </p>
                      )}
                    </Callout.Text>
                  </Callout.Root>
                  <Alerte type="info">
                    <h3>Accusé de réception : ce que cela implique</h3>
                    <p>
                      Le territoire ne pourra plus intervenir sur cet indicateur
                      tant que vous n'aurez pas pris une décision (accepter,
                      accepter avec modification ou refuser) ou procédé à un
                      nouvel import de données.
                    </p>
                  </Alerte>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="secondary"
                      className="mr-4"
                      onClick={() =>
                        setEtapeAccuserReception(
                          EtapeAccuserReception.EXAMEN_PROPOSITION,
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
                        ? "Envoi en cours..."
                        : "Confirmer l'envoi de l'accusé de réception"}
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
            L'accusé de réception de cette proposition de valeur d'avancement a
            bien été enregistré
          </h3>
          <span>
            Le territoire est informé du fait que vous avez pris connaissance de
            sa proposition. Le cas échéant, nous vous invitons à engager le
            dialogue avec le territoire afin d'étayer votre future décision.
          </span>
        </Alerte>
      )}
    </Modale>
  );
};
