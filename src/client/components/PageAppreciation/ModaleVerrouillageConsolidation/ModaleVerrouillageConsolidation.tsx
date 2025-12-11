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

export const ModaleTransmissionDITP = ({
  fichesConsolidation,
  children,
}: PropsWithChildren<{
  fichesConsolidation: FicheEvaluation[];
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
  } = useModaleVerrouillageConsolidation(fichesConsolidation);
  const refreshRouter = useRefreshRouter();

  return (
    <Modale
      onOpenChange={(open) => {
        if (!open) {
          refreshRouter();
        }
      }}
      title="Transmettre les appréciations"
      titleHidden
      trigger={children}
    >
      {etapeTransmission ? (
        <>
          <div className="fr-stepper fr-mb-1w">
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
                <>
                  <p className="fr-text--sm fr-mb-2w">
                    Vous pouvez transmettre vos appréciations à la DITP en
                    plusieurs fois, territoire par territoire. Le cas échéant,
                    l'ensemble de vos appréciations (sur les objectifs
                    individuels et sur la manière de servir) sont transmises en
                    vue d'être instruites.
                  </p>

                  <p className="fr-text--sm fr-mb-2w">
                    Une fois transmises, les appréciations d'un territoire
                    (qu'elles soient marquées comme traitées ou non) ne seront
                    plus modifiables mais resteront consultables et imprimables.
                  </p>

                  <hr className="fr-mb-2w" />

                  <h3 className="fr-h6 fr-mb-1w">
                    Territoires dont les appréciations n'ont pas encore été
                    transmises
                  </h3>

                  <p className="fr-text--sm fr-mb-2w">
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
                    <div className="grid grid-cols-3 gap-4">
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
                        const territoireLabel = fiche.rattachement.code
                          ? `${fiche.rattachement.code} - ${fiche.rattachement.libelle}`
                          : fiche.rattachement.libelle;

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
                            <span className="text-base">{territoireLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="w-full flex justify-end fr-mt-2w gap-2">
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
                </>
              ) : (
                <>
                  <p className="fr-text--sm fr-mb-2w">
                    Veuillez vérifier ci-dessous la liste des territoires dont
                    vous souhaitez transmettre vos appréciations :
                  </p>

                  <ul className="fr-mb-2w">
                    {fichesConsolidation
                      .filter((fiche) => fichesSelectionnees.includes(fiche.id))
                      .map((fiche) => (
                        <li
                          className="flex items-center gap-2 fr-mb-1w"
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

                  <div className="w-full flex justify-end fr-mt-2w gap-2">
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
                </>
              )}
            </form>
          </FormProvider>
        </>
      ) : (
        <div className="fr-alert fr-alert--success fr-mt-2w">
          <h3 className="fr-alert__title">
            Les territoires ont été transmis à la DITP avec succès
          </h3>
        </div>
      )}
    </Modale>
  );
};
