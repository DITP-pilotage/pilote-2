import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FunctionComponent } from "react";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import {
  libellésMétéos,
  MétéoSaisissable,
  météosSaisissables,
} from "@/server/domain/météo/Météo.interface";
import Titre from "@/components/_commons/Titre/Titre";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import {
  LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import SyntheseDesResultatsFormulaireStyled from "./SyntheseDesResultatsFormulaire.styled";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";
import { useModifierSyntheseDesResultats } from "./useModifierSyntheseDesResultats";

interface SyntheseDesResultatsFormulaireProps {
  annulationCallback?: () => void;
}

const SyntheseDesResultatsFormulaire: FunctionComponent<
  SyntheseDesResultatsFormulaireProps
> = ({ annulationCallback }) => {
  const { syntheseDesResultats } = pageChantier.useServerSidePropsContext();

  const modifierSynthèseDesRésultats = useModifierSyntheseDesResultats();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
  } = useForm<SyntheseDesResultatsFormulaireInputs>({
    mode: "all",
    resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
    defaultValues: {
      contenu: syntheseDesResultats?.contenu,
      meteo:
        syntheseDesResultats?.météo &&
        météosSaisissables.includes(syntheseDesResultats.météo)
          ? (syntheseDesResultats.météo as MétéoSaisissable)
          : undefined,
    },
  });

  return (
    <SyntheseDesResultatsFormulaireStyled
      method="post"
      onSubmit={handleSubmit(modifierSynthèseDesRésultats)}
    >
      <Titre baliseHtml="h3" className="fr-h5 fr-mb-1v">
        Modifier la météo et la synthèse des résultats
      </Titre>
      <p className="fr-text--xs fr-mb-1w !text-dsfr-mention-grey">
        {`Résumez l'état d'avancement du chantier et indiquez si vous souhaitez solliciter du soutien en quelques phrases (${LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS} caractères maximum). La météo doit indiquer votre niveau de confiance dans la possibilité d'atteindre les objectifs du chantier et le niveau d'appui nécessaire.`}
      </p>
      <div
        className={`fr-mb-0 fr-input-group ${errors.contenu && "fr-input-group--error"}`}
      >
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          rows={6}
          {...register("contenu")}
        />
        <div className="flex justify-between">
          <div>
            {!!errors.contenu && (
              <p className="fr-error-text fr-mt-0 fr-mr-2w">
                {errors.contenu.message}
              </p>
            )}
          </div>
          <CompteurCaractères
            compte={watch("contenu")?.length ?? 0}
            limiteDeCaractères={LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS}
          />
        </div>
      </div>
      <div className="fr-mt-1v flex partie-basse">
        <Sélecteur<MétéoSaisissable>
          htmlName="météo"
          libellé="Météo"
          options={météosSaisissables.map((optionMétéo) => ({
            libellé: libellésMétéos[optionMétéo],
            valeur: optionMétéo,
          }))}
          register={{ ...register("meteo") }}
          texteFantôme="Météo à renseigner"
          valeurSélectionnée={getValues("meteo")}
        />
        <div className="fr-mx-3w météo-picto-conteneur">
          {!!watch("meteo") && <MeteoPicto meteo={watch("meteo")!} />}
        </div>
        <div className="actions">
          <button className="fr-btn fr-mr-3w" disabled={!isValid} type="submit">
            Publier
          </button>
          <button
            className="fr-btn fr-btn--secondary"
            onClick={annulationCallback}
            type="button"
          >
            Annuler
          </button>
        </div>
      </div>
    </SyntheseDesResultatsFormulaireStyled>
  );
};

export default SyntheseDesResultatsFormulaire;
