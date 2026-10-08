import { FunctionComponent, PropsWithChildren } from "react";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextareaField } from "@/components/shared/TextField";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Callout } from "@/components/shared/Callout";
import { FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { formaterDate } from "@/client/utils/date/date";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import useModaleSuppressionValeurAvancement, {
  EtapeSuppressionPropositionValeurAvancement,
  Stepper,
} from "./useModaleSuppressionValeurAvancement";

export const ModaleSuppressionValeurAvancement: FunctionComponent<
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
    supprimerPropositionValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    etapeSuivanteEstDesactive,
    isPending,
  } = useModaleSuppressionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });
  const utilisateur = useProfilUtilisateurConnecte();
  const auteurModification = `${utilisateur.prenom} ${utilisateur.nom}`;
  const refreshRouter = useRefreshRouter();

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
        }
      }}
      title="Supprimer la proposition"
      titleHidden
      trigger={children}
    >
      {etapePropositionValeurAvancement ? (
        <>
          <StepIndicator
            className="mb-2"
            currentStep={Stepper[etapePropositionValeurAvancement].numeroEtape}
            label="Supprimer la proposition de valeur d'avancement"
            nextStep={Stepper[etapePropositionValeurAvancement].etapeSuivante}
            stepCount={2}
            title={Stepper[etapePropositionValeurAvancement].titre}
          />
          <FormProvider {...reactHookForm}>
            <form
              method="post"
              onSubmit={reactHookForm.handleSubmit((data) => {
                supprimerPropositionValeurAvancement(data);
              })}
            >
              {etapePropositionValeurAvancement ===
              EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION ? (
                <>
                  <h2 className="fr-h4">
                    {`${indicateur.id} ${indicateur.nom}`}
                  </h2>
                  <p className="fr-text fr-text--sm fr-mb-1w">
                    {`${territoireCodeInsee} - ${territoireNom}`}
                  </p>
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
                          {` le ${formaterDate(detailIndicateur.proposition!.dateProposition, "DD/MM/YYYY")}`}
                        </span>
                      </span>
                      <div className="w-full flex flex-column align-center fr-pt-1w">
                        <span className="flex justify-center fr-mb-5v">
                          {detailIndicateur.proposition?.valeurAvancement}
                        </span>
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
                  <div className="fr-mt-2w">
                    <TextareaField
                      className={FIELD_GROUP_SPACING}
                      counter={{
                        length: reactHookForm.watch("motifSuppression").length,
                        max: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      errorMessage={
                        reactHookForm.formState.errors.motifSuppression?.message
                      }
                      id="motifSuppression"
                      required
                      hint="*ce champ est obligatoire"
                      label="Motif de la suppression"
                      placeholder="Indiquez ici les raisons pour lesquelles vous souhaitez supprimer la proposition de valeur d'avancement."
                      textareaClassName="resize-none"
                      {...reactHookForm.register("motifSuppression", {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="primary"
                      disabled={etapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapeSuppressionPropositionValeurAvancement.VALIDATION_SUPPRESSION_PROPOSITION,
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
                    Veuillez vérifier si le motif de suppression indiqué
                    ci-dessous est correct avant de confirmer l'opération.
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
                        <span className="fr-text--bold">
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
                          : {detailIndicateur.proposition?.valeurAvancement} (
                          {formaterDate(
                            detailIndicateur.dateValeurAvancementMandat,
                            "MM/YYYY",
                          )}
                          )
                        </span>
                      </p>
                      <p className="fr-text--sm mb-0">
                        <span className="fr-text--bold">
                          La proposition est supprimée le{" "}
                          {`${formaterDate(new Date().toISOString(), "DD/MM/YYYY")}`}{" "}
                          par {auteurModification}
                        </span>
                      </p>
                      <p className="fr-text--sm mb-0">
                        <span className="fr-text--bold">
                          Motif de la suppression :
                        </span>{" "}
                        <span className="text-italic">
                          {reactHookForm.getValues("motifSuppression")}
                        </span>
                      </p>
                    </Callout.Text>
                  </Callout.Root>
                  <Alerte type="info">
                    <h3>Rappel sur la documentation des propositions</h3>
                    <p>
                      La proposition initiale et la suppression de celle-ci
                      resteront visibles dans l'historique de l'indicateur.
                    </p>
                  </Alerte>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <Button
                      variant="secondary"
                      className="mr-4"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION,
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
                        ? "Suppression en cours..."
                        : "Supprimer la proposition"}
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
            La proposition de valeur d'avancement a correctement été supprimée
          </h3>
          <span>
            La suppression sera effective dans le tableau des indicateurs dans
            une heure. Veuillez noter que, dans cet intervalle, il n'est pas
            possible de faire une autre proposition pour cet indicateur.
          </span>
        </Alerte>
      )}
    </Modale>
  );
};
