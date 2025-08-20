import { FunctionComponent } from "react";
import { FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { formaterDate } from "@/client/utils/date/date";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import useModaleSuppressionValeurAvancementV2, {
  EtapeSuppressionPropositionValeurAvancement,
  Stepper,
} from "./useModaleSuppressionValeurAvancementV2";

export const ModaleSuppressionValeurAvancementV2: FunctionComponent<{
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
    supprimerPropositionValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    etapeSuivanteEstDesactive,
  } = useModaleSuppressionValeurAvancementV2({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  const router = useRouter();

  return (
    <Modale
      fermetureCallback={() => {
        router.replace(router.asPath, undefined, { scroll: false });
      }}
      idHtml={generatedHTMLID}
      tailleModale="lg"
    >
      {etapePropositionValeurAvancement ? (
        <>
          <div className="fr-stepper fr-mb-1w">
            <h2 className="fr-stepper__title">
              <span>
                {`${Stepper[etapePropositionValeurAvancement].titre}`}
              </span>
              <span className="fr-stepper__state">
                {`Supprimer la proposition de valeur d'avancement - Étape ${Stepper[etapePropositionValeurAvancement].numeroEtape} sur 2`}
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
                        {`Valeur d'avancement proposée par ${detailIndicateur.proposition?.auteur} le ${formaterDate(detailIndicateur.proposition!.dateProposition, "DD/MM/YYYY")}`}
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
                    <TextAreaAvecLabel
                      compteur={{
                        taille: reactHookForm.watch("motifSuppression").length,
                        limite: LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
                      }}
                      erreurMessage={
                        reactHookForm.formState.errors.motifSuppression?.message
                      }
                      htmlName="motifSuppression"
                      isRequired
                      libelleRequired="*ce champ est obligatoire"
                      libellé="Motif de la suppression"
                      placeholder="Indiquez ici les raisons pour lesquelles vous souhaitez supprimer la proposition de valeur d'avancement."
                      register={reactHookForm.register("motifSuppression", {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn"
                      disabled={etapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapeSuppressionPropositionValeurAvancement.VALIDATION_SUPPRESSION_PROPOSITION,
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
                    Veuillez vérifier si le motif de suppression indiqué
                    ci-dessous est correct avant de confirmer l'opération.
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
                        {`${formaterDate(detailIndicateur.proposition?.dateProposition, "DD/MM/YYYY")}`}{" "}
                        par {detailIndicateur.proposition?.auteur} :{" "}
                        {detailIndicateur.proposition?.valeurAvancement} (
                        {formaterDate(
                          detailIndicateur.dateValeurAvancementMandat,
                          "MM/YYYY",
                        )}
                        )
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        La proposition est supprimée le{" "}
                        {`${formaterDate(new Date().toISOString(), "DD/MM/YYYY")}`}{" "}
                        par {auteurModification}
                      </span>
                    </p>
                    <p className="fr-callout__text fr-text--sm">
                      <span className="fr-text--bold">
                        Motif de la suppression :
                      </span>{" "}
                      <span className="text-italic">
                        {reactHookForm.getValues("motifSuppression")}
                      </span>
                    </p>
                  </div>
                  <div className="fr-alert fr-alert--info">
                    <h3 className="fr-alert__title">
                      Rappel sur la documentation des propositions
                    </h3>
                    <p>
                      La proposition initiale et la suppression de celle-ci
                      resteront visibles dans l'historique de l'indicateur.
                    </p>
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn fr-btn--secondary fr-mr-2w"
                      onClick={() =>
                        setEtapePropositionValeurAvancement(
                          EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION,
                        )
                      }
                      type="button"
                    >
                      Étape précédente
                    </button>
                    <button className="fr-btn" type="submit">
                      Supprimer la proposition
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
            La proposition de valeur d'avancement a correctement été supprimée
          </h3>
          <span>
            La suppression sera effective dans le tableau des indicateurs dans
            une heure. Veuillez noter que, dans cet intervalle, il n'est pas
            possible de faire une autre proposition pour cet indicateur.
          </span>
        </div>
      )}
    </Modale>
  );
};
