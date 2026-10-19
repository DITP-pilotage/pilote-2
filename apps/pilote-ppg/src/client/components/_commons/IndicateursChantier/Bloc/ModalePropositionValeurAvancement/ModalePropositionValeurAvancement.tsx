import { LABEL_CLASSES } from "@/components/shared/fieldTextClasses";
import { FunctionComponent, PropsWithChildren } from "react";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { TextField, TextareaField } from "@/components/shared/TextField";
import { SelectField } from "@/components/shared/SelectField";
import { Button } from "@/components/shared/Button";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { Callout } from "@/components/shared/Callout";
import { FormProvider } from "react-hook-form";
import { Modale } from "@/components/shared/Modale";

import useModalePropositionValeurAvancement, {
  EtapePropositionValeurAvancement,
  Stepper,
} from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/useModalePropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import { ChampObligatoire } from "@/components/_commons/ChampObligatoire/ChampObligatoire";
import { Infobulle } from "@/components/shared/Infobulle";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useEnv } from "@/client/hooks/useEnv";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";

export const ModalePropositionValeurAvancement: FunctionComponent<
  PropsWithChildren
> = ({ children }) => {
  const utilisateur = useProfilUtilisateurConnecte();
  const auteurModification = `${utilisateur.prenom} ${utilisateur.nom}`;

  const {
    reactHookForm,
    creerPropositonValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    reinitialiser,
    passerALaValidation,
    choisirMois,
    estUneModificationDeProposition,
    optionsMois,
    isPending,
  } = useModalePropositionValeurAvancement();

  const refreshRouter = useRefreshRouter();
  const {
    indicateur,
    detailIndicateurDuTerritoire,
    territoireSélectionné: {
      codeInsee: territoireCodeInsee,
      nom: territoireNom,
    },
  } = useBlocIndicateurContext();
  const ffPvaValeurDifferente = useEnv("NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE");

  return (
    <Modale
      onOpenChange={(open) => {
        if (open) {
          reinitialiser();
        } else {
          refreshRouter();
        }
      }}
      title="Proposer une valeur d'avancement"
      titleHidden
      trigger={children}
    >
      {etapePropositionValeurAvancement ? (
        <>
          <StepIndicator
            className="mb-2"
            currentStep={Stepper[etapePropositionValeurAvancement].numeroEtape}
            label={
              estUneModificationDeProposition
                ? "Modifier la proposition de valeur d'avancement"
                : "Proposer une autre valeur d'avancement"
            }
            nextStep={Stepper[etapePropositionValeurAvancement].etapeSuivante}
            stepCount={2}
            title={Stepper[etapePropositionValeurAvancement].titre}
          />
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
                  <h2 className="text-h4 md:text-h4-md">
                    {`${indicateur.id} ${indicateur.nom}`}
                  </h2>
                  <p className="text-sm print:text-base mb-2">
                    {`${territoireCodeInsee} - ${territoireNom}`}
                  </p>
                  <p className="text-xs print:text-base texte-warning italic mb-4">
                    *tous les champs sont obligatoires
                  </p>
                  {detailIndicateurDuTerritoire.proposition !== null ? (
                    <p className="text-sm print:text-base mt-1">
                      La proposition de nouvelle valeur d'avancement que vous
                      modifiez a été faite par{" "}
                      <NomUtilisateurAvecTooltip
                        nom={detailIndicateurDuTerritoire.proposition.auteur!}
                        service={
                          detailIndicateurDuTerritoire.proposition.auteurService
                        }
                        fonction={
                          detailIndicateurDuTerritoire.proposition
                            .auteurFonction
                        }
                      />{" "}
                      le{" "}
                      {formaterDate(
                        detailIndicateurDuTerritoire.proposition
                          .dateProposition,
                        "DD/MM/YYYY",
                      )}
                      . Toute modification apportée à cette proposition écrasera
                      et remplacera celle-ci.
                    </p>
                  ) : null}
                  <div className="w-full flex mt-4">
                    <div className="w-1/2 mr-2 border flex flex-col">
                      <span className="bg-dsfr-blue-france-925 flex justify-center p-2 border">
                        Valeur d'avancement importée par la direction de projet
                      </span>
                      <div className="w-full flex flex-col justify-between pt-2">
                        <span className="flex justify-center mb-5">
                          {detailIndicateurDuTerritoire.valeurAvancementMandat?.toLocaleString(
                            "fr-FR",
                          )}
                        </span>
                        <span className="flex justify-center items-end texte-gris">
                          (
                          {formaterDate(
                            detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                            "MM/YYYY",
                          )}
                          )
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2 ml-2 border">
                      {estUneModificationDeProposition ? (
                        <span className="bg-dsfr-blue-france-925 w-full flex justify-center p-2">
                          <span>
                            {`Valeur d'avancement proposée par `}
                            <NomUtilisateurAvecTooltip
                              nom={
                                detailIndicateurDuTerritoire.proposition!
                                  .auteur!
                              }
                              service={
                                detailIndicateurDuTerritoire.proposition
                                  ?.auteurService ?? null
                              }
                              fonction={
                                detailIndicateurDuTerritoire.proposition
                                  ?.auteurFonction ?? null
                              }
                            />
                            {` le ${formaterDate(detailIndicateurDuTerritoire.proposition!.dateProposition, "DD/MM/YYYY")}`}
                          </span>
                          <Infobulle classNameInfoBulle="tooltip-accordeon">
                            <p className="text-sm print:text-base texte-proposition">
                              Valeur d'avancement proposée le{" "}
                              {formaterDate(
                                detailIndicateurDuTerritoire.proposition
                                  ?.dateProposition,
                                "DD/MM/YYYY",
                              )}{" "}
                              par{" "}
                              {detailIndicateurDuTerritoire.proposition?.auteur}
                            </p>
                            <p className="text-sm print:text-base">
                              <b>Motif de la proposition</b>
                            </p>
                            <p className="text-sm print:text-base">
                              {detailIndicateurDuTerritoire.proposition?.motif}
                            </p>
                            <p className="text-sm print:text-base">
                              <b>Source des données et méthode de calcul</b>
                            </p>
                            <p className="text-sm print:text-base mb-0">
                              {
                                detailIndicateurDuTerritoire.proposition
                                  ?.sourceDonneeEtMethodeCalcul
                              }
                            </p>
                          </Infobulle>
                        </span>
                      ) : (
                        <span className="bg-dsfr-blue-france-925 w-full flex justify-center p-2">
                          Proposition de nouvelle valeur d'avancement
                          <ChampObligatoire />
                        </span>
                      )}
                      <div className="w-full flex flex-col items-center pt-2">
                        {estUneModificationDeProposition ? (
                          <span className="flex justify-center mb-5">
                            {
                              detailIndicateurDuTerritoire.proposition
                                ?.valeurAvancement
                            }
                          </span>
                        ) : (
                          <div className="w-1/2 flex mb-2">
                            <TextField
                              className={FIELD_GROUP_SPACING}
                              errorMessage={
                                reactHookForm.formState.errors.valeurAvancement
                                  ?.message
                              }
                              id="valeurAvancement"
                              type="text"
                              inputClassName="text-center"
                              {...reactHookForm.register("valeurAvancement")}
                            />
                          </div>
                        )}

                        <span className="flex justify-center texte-gris">
                          ({reactHookForm.watch("moisValeurAvancement")})
                        </span>
                      </div>
                    </div>
                  </div>
                  {ffPvaValeurDifferente && !estUneModificationDeProposition ? (
                    <div className="mt-4">
                      <SelectField
                        errorMessage={
                          reactHookForm.formState.errors.moisValeurAvancement
                            ?.message
                        }
                        name="moisValeurAvancement"
                        label={
                          <>
                            Date de la valeur d'avancement proposée
                            <ChampObligatoire />
                          </>
                        }
                        onChange={choisirMois}
                        options={optionsMois}
                        value={reactHookForm.watch("moisValeurAvancement")}
                        triggerClassName="w-50"
                      />
                      <span className="m-[var(--text-spacing)] text-xs print:text-base flex texte-gris mt-1">
                        Dernière date de la valeur d'avancement :
                        {formaterDate(
                          detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                      </span>
                    </div>
                  ) : null}
                  {estUneModificationDeProposition ? (
                    <div className="mt-4">
                      <label
                        className={LABEL_CLASSES}
                        htmlFor="valeurAvancement"
                      >
                        Valeur modifiée
                        <ChampObligatoire />
                      </label>
                      <TextField
                        className="mb-1"
                        errorMessage={
                          reactHookForm.formState.errors.valeurAvancement
                            ?.message
                        }
                        id="valeurAvancement"
                        type="text"
                        inputClassName="mt-1 py-1 text-sm"
                        {...reactHookForm.register("valeurAvancement")}
                      />
                      <span className="m-[var(--text-spacing)] text-xs print:text-base flex texte-gris">
                        (
                        {formaterDate(
                          detailIndicateurDuTerritoire.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-4">
                    <TextareaField
                      className={FIELD_GROUP_SPACING}
                      counter={{
                        length: reactHookForm.watch("motifProposition").length,
                        max: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      errorMessage={
                        reactHookForm.formState.errors.motifProposition?.message
                      }
                      id="motifProposition"
                      required
                      label="Motif de la proposition"
                      placeholder="Indiquez ici d'où provient la différence entre la valeur actuelle que vous proposez et celle qui a été importée initialement par la direction de projet."
                      textareaClassName="resize-none"
                      {...reactHookForm.register("motifProposition", {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="mt-4">
                    <TextareaField
                      className={FIELD_GROUP_SPACING}
                      counter={{
                        length: reactHookForm.watch(
                          "sourceDonneeEtMethodeCalcul",
                        ).length,
                        max: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      errorMessage={
                        reactHookForm.formState.errors
                          .sourceDonneeEtMethodeCalcul?.message
                      }
                      id="sourceDonneeEtMethodeCalcul"
                      required
                      label="Sources des données et méthode de calcul"
                      placeholder="Afin de documenter votre proposition, indiquez ici la source de vos données ainsi que la méthode de calcul qui vous a permis d'aboutir à la valeur proposée. Le cas échéant, précisez en quoi cette méthode est différente de celle mise en œuvre par la direction de projet"
                      textareaClassName="resize-none h-[90px]"
                      {...reactHookForm.register(
                        "sourceDonneeEtMethodeCalcul",
                        { required: true },
                      )}
                    />
                  </div>
                  <div className="w-full flex justify-end mt-4">
                    <Button
                      variant="primary"
                      onClick={passerALaValidation}
                      type="button"
                    >
                      Étape suivante
                    </Button>
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
                  <Callout.Root className="mt-4 px-6 py-4" color="highlight">
                    <Callout.Text>
                      <Callout.Title>
                        {`${indicateur.id} ${indicateur.nom}`}
                      </Callout.Title>
                      <p className="text-sm print:text-base mb-2">
                        {`${territoireCodeInsee} - ${territoireNom}`}
                      </p>
                      <p className="text-sm print:text-base mb-0">
                        <span className="font-bold">
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
                      <p className="text-sm print:text-base mb-0">
                        <span className="font-bold">
                          Date de la proposition de valeur d'avancement : 
                        </span>
                        <span className="italic">
                          {reactHookForm.getValues("moisValeurAvancement")}
                        </span>
                      </p>
                      <p className="text-sm print:text-base mb-0">
                        <span className="font-bold">
                          Motif de la proposition :
                        </span>{" "}
                        <span className="italic">
                          {reactHookForm.getValues("motifProposition")}
                        </span>
                      </p>
                      <p className="text-sm print:text-base mb-0">
                        <span className="font-bold">
                          Source des données et méthode de calcul :
                        </span>{" "}
                        <span className="italic">
                          {reactHookForm.getValues(
                            "sourceDonneeEtMethodeCalcul",
                          )}
                        </span>
                      </p>
                    </Callout.Text>
                  </Callout.Root>
                  <Alerte type="info">
                    <h3>Rappel sur le statut de votre proposition</h3>
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
                  </Alerte>
                  <div className="w-full flex justify-end mt-4">
                    <Button
                      variant="secondary"
                      className="mr-4"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE,
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
                        ? "Publication en cours..."
                        : "Publier la proposition"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <Alerte type="succès" classesSupplementaires="mt-4">
          {!estUneModificationDeProposition ? (
            <>
              <h3>
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
              <h3>
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
        </Alerte>
      )}
    </Modale>
  );
};
