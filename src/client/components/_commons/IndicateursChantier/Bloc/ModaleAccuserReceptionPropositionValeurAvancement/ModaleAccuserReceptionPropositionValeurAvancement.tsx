import { FunctionComponent } from "react";
import { FormProvider } from "react-hook-form";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";

import {
  EtapeAccuserReception,
  Stepper,
  useModaleAccuserReceptionPropositionValeurAvancement,
} from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccuserReceptionPropositionValeurAvancement/useModaleAccuserReceptionPropositionValeurAvancement";
import { formaterDate } from "@/client/utils/date/date";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";
import { ComparaisonValeurBox } from "@/components/_commons/IndicateursChantier/Bloc/ComparaisonValeurBox";

export const ModaleAccuserReceptionPropositionValeurAvancement: FunctionComponent<{
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
    etapeAccuserReception,
    setEtapeAccuserReception,
    etapeSuivanteEstDesactive,
    traiterAccuseReception,
  } = useModaleAccuserReceptionPropositionValeurAvancement({
    indicateur,
    detailIndicateur,
    territoireCode,
  });

  return (
    <Modale idHtml={generatedHTMLID} tailleModale="lg">
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
                      date={detailIndicateur.dateValeurAvancementMandat}
                      titre={`Valeur d'avancement proposée par ${detailIndicateur.proposition?.auteur} le ${formaterDate(
                        detailIndicateur.proposition?.dateProposition,
                        "DD/MM/YYYY",
                      )}`}
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
                    <TextAreaAvecLabel
                      erreurMessage={
                        reactHookForm.formState.errors.motif?.message
                      }
                      htmlName="motif"
                      libellé="Indiquez ici les raisons qui motivent votre choix."
                      placeholder="Indiquez ici les raisons qui motivent votre choix."
                      register={reactHookForm.register("motif")}
                    />
                    <p className="fr-text--xs texte-gris">
                      (500 caractères restants)
                    </p>
                  </div>

                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn"
                      disabled={etapeSuivanteEstDesactive}
                      onClick={() =>
                        setEtapeAccuserReception(
                          EtapeAccuserReception.VALIDATION_ACCUSE_RECEPTION,
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
                    Vous vous apprêtez à accuser réception de la proposition
                    suivante :
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
                        {formaterDate(
                          detailIndicateur.proposition?.dateProposition,
                          "DD/MM/YYYY",
                        )}{" "}
                        par {detailIndicateur.proposition?.auteur} :{" "}
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
                    {reactHookForm.getValues("motif") && (
                      <p className="fr-callout__text fr-text--sm">
                        <span className="fr-text--bold">
                          Informations complémentaires :
                        </span>{" "}
                        <span className="text-italic">
                          {reactHookForm.getValues("motif")}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="fr-alert fr-alert--info">
                    <h3 className="fr-alert__title">
                      Accusé de réception : ce que cela implique
                    </h3>
                    <p>
                      Le territoire ne pourra plus intervenir sur cet indicateur
                      tant que vous n'aurez pas pris une décision (accepter,
                      accepter avec modification ou refuser) ou procédé à un
                      nouvel import de données.
                    </p>
                  </div>
                  <div className="w-full flex justify-end fr-mt-2w">
                    <button
                      className="fr-btn fr-btn--secondary fr-mr-2w"
                      onClick={() =>
                        setEtapeAccuserReception(
                          EtapeAccuserReception.EXAMEN_PROPOSITION,
                        )
                      }
                      type="button"
                    >
                      Étape précédente
                    </button>
                    <button className="fr-btn" type="submit">
                      Confirmer l'envoi de l'accusé de réception
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
            L'accusé de réception de cette proposition de valeur d'avancement a
            bien été enregistré
          </h3>
          <span>
            Le territoire est informé du fait que vous avez pris connaissance de
            sa proposition. Le cas échéant, nous vous invitons à engager le
            dialogue avec le territoire afin d'étayer votre future décision.
          </span>
        </div>
      )}
    </Modale>
  );
};
