import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { FunctionComponent } from "react";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import {
  MétéoSaisissable,
  météosSaisissables,
} from "@/server/domain/météo/Météo.interface";
import Titre from "@/components/_commons/Titre/Titre";
import {
  LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";
import { formaterDate } from "@/client/utils/date/date";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SyntheseDesResultatsAction } from "@/components/PageChantier/SynthèseDesRésultatsChantier/AlerteSyntheseDesResultats";
import {
  CONSIGNE_SYNTHÈSE_DES_RÉSULTATS,
  LIBELLÉ_SYNTHÈSE_DES_RÉSULTATS,
} from "@/client/constants/libellesSyntheseDesResultats";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import SyntheseDesResultatsFormulaireStyled from "./SyntheseDesResultatsFormulaire.styled";
import { SyntheseDesResultatsFormulaireInputs } from "./SyntheseDesResultatsFormulaire.interface";
import { useModifierSyntheseDesResultats } from "./useModifierSyntheseDesResultats";
import { SelecteurMeteo } from "./SelecteurMeteo";

interface SyntheseDesResultatsFormulaireProps {
  annulationCallback?: () => void;
  onSucess: (action: SyntheseDesResultatsAction) => void;
}

const SyntheseDesResultatsFormulaire: FunctionComponent<
  SyntheseDesResultatsFormulaireProps
> = ({ annulationCallback, onSucess }) => {
  const { syntheseDesResultats } = pageChantier.useServerSidePropsContext();

  const modifierSynthèseDesRésultats = useModifierSyntheseDesResultats({
    onSucess,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
  } = useForm<SyntheseDesResultatsFormulaireInputs>({
    mode: "all",
    resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
    defaultValues: {
      contenu: syntheseDesResultats?.contenu,
      meteo:
        syntheseDesResultats?.meteo &&
        météosSaisissables.includes(syntheseDesResultats.meteo)
          ? (syntheseDesResultats.meteo as MétéoSaisissable)
          : undefined,
    },
  });

  return (
    <SyntheseDesResultatsFormulaireStyled
      method="post"
      onSubmit={handleSubmit(modifierSynthèseDesRésultats)}
    >
      <div className="flex items-center gap-2 fr-mb-1v">
        <Titre baliseHtml="h3" className="text-xl mb-0">
          {`Modifier le commentaire "${LIBELLÉ_SYNTHÈSE_DES_RÉSULTATS}"`}
        </Titre>
        <Infobulle classNameIcone="w-5 h-5">
          {CONSIGNE_SYNTHÈSE_DES_RÉSULTATS}
        </Infobulle>
      </div>
      <p className="fr-text--xs mb-4 text-dsfr-mention-grey">
        {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${formaterDate(syntheseDesResultats?.dateModification, "DD/MM/YYYY")}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
      </p>
      <div className="flex flex-1 gap-4 items-stretch">
        <div className="flex-none w-60">
          <Controller
            control={control}
            name="meteo"
            render={({ field }) => (
              <SelecteurMeteo
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                value={field.value}
              />
            )}
          />
        </div>
        <div
          className={`flex-1 flex flex-col fr-mb-0 fr-input-group ${errors.contenu && "fr-input-group--error"}`}
        >
          <textarea
            className="fr-input fr-text--sm fr-mb-0 flex-1"
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
      </div>
      <div className="flex justify-end fr-mt-2w">
        <Bouton
          className="mr-3"
          disabled={!isValid}
          iconLeft={
            <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
          }
          label="Valider"
          type="submit"
          variant="primary"
        />
        <Bouton
          iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
          label="Annuler"
          onClick={annulationCallback}
          variant="secondary"
        />
      </div>
    </SyntheseDesResultatsFormulaireStyled>
  );
};

export default SyntheseDesResultatsFormulaire;
