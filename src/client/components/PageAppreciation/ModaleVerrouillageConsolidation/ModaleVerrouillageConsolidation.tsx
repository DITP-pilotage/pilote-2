import "@gouvfr/dsfr/dist/component/stepper/stepper.min.css";
import { Dialog } from "radix-ui";
import { FormProvider } from "react-hook-form";
import { PropsWithChildren } from "react";
import { Modale } from "@/components/shared/Modale";
import { Checkbox } from "@/components/shared/Checkbox";
import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";
import {
  EtapeTransmission,
  Stepper,
  useTransmissionDITP as useModaleVerrouillageConsolidation,
} from "@/components/PageAppreciation/ModaleVerrouillageConsolidation/useModaleVerrouillageConsolidation";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { Icone } from "@/components/_commons/Icone";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import Alerte from "@/components/_commons/Alerte/Alerte";

export const ModaleTransmissionDITP = ({
  fichesAppreciation,
  children,
}: PropsWithChildren<{
  fichesAppreciation: FicheEvaluation[];
}>) => {
  const {
    reactHookForm,
    etapeTransmission,
    setEtapeTransmission,
    fichesSelectionnables,
    fichesSelectionnees,
    tousSelectionnes,
    toggleTout,
    verrouillerLaConsolidation,
    reset,
  } = useModaleVerrouillageConsolidation(fichesAppreciation);
  const refreshRouter = useRefreshRouter();

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
          reset();
        }
      }}
      size="md"
      title="Transmettre les appréciations"
      titleHidden
      trigger={children}
    >
      {etapeTransmission ? (
        <>
          <div className="fr-stepper !mb-1">
            <h2 className="fr-stepper__title">
              <span>{`${Stepper[etapeTransmission].titre}`}</span>
              <span className="fr-stepper__state">
                {`Transmettre les appréciations - Étape ${Stepper[etapeTransmission].numeroEtape} sur 2`}
              </span>
            </h2>
            <div
              className="fr-stepper__steps"
              data-fr-current-step={Stepper[etapeTransmission].numeroEtape}
              data-fr-steps="2"
            />
            {Stepper[etapeTransmission].etapeSuivante ? (
              <p className="fr-stepper__details">
                <span className="fr-text--bold">Étape suivante :</span>
                {` ${Stepper[etapeTransmission].etapeSuivante}`}
              </p>
            ) : null}
          </div>

          <FormProvider {...reactHookForm}>
            <form
              onSubmit={reactHookForm.handleSubmit(() => {
                verrouillerLaConsolidation();
              })}
            >
              {etapeTransmission === EtapeTransmission.SELECTION_TERRITOIRES ? (
                <div className="pt-6 space-y-4">
                  <p className="!text-sm mb-4">
                    Vous pouvez transmettre vos appréciations à la DITP en
                    plusieurs fois, territoire par territoire. Le cas échéant,
                    l'ensemble de vos appréciations (sur les objectifs
                    individuels et sur la manière de servir) sont transmises en
                    vue d'être instruites.
                  </p>

                  <p className="!text-sm mb-4">
                    Une fois transmises, les appréciations d'un territoire
                    (qu'elles soient marquées comme traitées ou non) ne seront
                    plus modifiables mais resteront consultables et imprimables.
                  </p>

                  <hr className="mb-4" />

                  <h3 className="font-bold !text-base !mb-2">
                    Territoires dont les appréciations n'ont pas encore été
                    transmises
                  </h3>

                  <p className="!text-sm !mb-4">
                    Indiquez ci-dessous les territoires dont vous souhaitez
                    transmettre toutes les appréciations :
                  </p>

                  {fichesSelectionnables.length === 0 ? (
                    <div className="fr-alert fr-alert--info">
                      <p className="fr-alert__title">
                        Aucun territoire disponible pour transmission
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                      <label className="col-span-3 flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={tousSelectionnes}
                          onCheckedChange={toggleTout}
                        />
                        <span className="text-base italic">
                          sélectionner tous les territoires
                        </span>
                      </label>

                      {fichesSelectionnables.map((fiche) => {
                        const territoireLabel =
                          fiche.rattachement.code.startsWith("REG-")
                            ? `Région ${fiche.rattachement.libelle}`
                            : `${fiche.rattachement.code.split("DEPT-")[1]} - ${fiche.rattachement.libelle}`;
                        const traite =
                          fiche.isCriteresValides && fiche.isObjectifsValides;

                        return (
                          <label
                            className="flex items-center gap-3 cursor-pointer"
                            key={fiche.id}
                          >
                            <Checkbox
                              checked={
                                reactHookForm.watch(
                                  `territoiresSelectionnes.${fiche.id}`,
                                ) ?? false
                              }
                              onCheckedChange={(checked) => {
                                reactHookForm.setValue(
                                  `territoiresSelectionnes.${fiche.id}`,
                                  checked === true,
                                );
                              }}
                            />
                            <span className="relative">
                              <span className="text-base">
                                {territoireLabel}
                              </span>
                              {!traite && (
                                <span className="absolute top-full left-0 whitespace-nowrap text-xs text-dsfr-mention-grey flex items-center gap-1">
                                  <Icone
                                    className="h-3 w-3 text-current"
                                    icone={WarningIcon}
                                  />
                                  traité partiellement
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="w-full flex justify-end !mt-8 gap-2">
                    <Dialog.Close asChild>
                      <button
                        className="fr-btn fr-btn--secondary"
                        type="button"
                      >
                        Annuler
                      </button>
                    </Dialog.Close>
                    <button
                      className="fr-btn"
                      disabled={fichesSelectionnees.length === 0}
                      onClick={() =>
                        setEtapeTransmission(EtapeTransmission.VALIDATION)
                      }
                      type="button"
                    >
                      Étape suivante
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-6 mt-6 space-y-6">
                  <p className="!text-sm mb-4">
                    Veuillez vérifier ci-dessous la liste des territoires dont
                    vous souhaitez transmettre vos appréciations :
                  </p>

                  <ul className="mb-4">
                    {fichesAppreciation
                      .filter((fiche) => fichesSelectionnees.includes(fiche.id))
                      .map((fiche) => (
                        <li
                          className="flex items-center gap-2 mb-1"
                          key={fiche.id}
                        >
                          <svg
                            aria-hidden="true"
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                          <span>
                            {fiche.rattachement.libelle} (
                            {fiche.rattachement.code})
                          </span>
                        </li>
                      ))}
                  </ul>

                  <div className="w-full flex justify-end !mt-8 gap-2">
                    <Dialog.Close asChild>
                      <button
                        className="fr-btn fr-btn--secondary"
                        type="button"
                      >
                        Annuler
                      </button>
                    </Dialog.Close>
                    <button
                      className="fr-btn fr-btn--secondary"
                      onClick={() =>
                        setEtapeTransmission(
                          EtapeTransmission.SELECTION_TERRITOIRES,
                        )
                      }
                      type="button"
                    >
                      Étape précédente
                    </button>
                    <button className="fr-btn" type="submit">
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <Alerte
          message="Un mail de confirmation vient de vous être envoyé. La DITP va
            prendre connaissance de vos appréciations et vous tiendra informé du
            passage en instruction des territoires concernés."
          titre="Les appréciations ont été transmises correctement"
          type="succès"
        />
      )}
    </Modale>
  );
};
