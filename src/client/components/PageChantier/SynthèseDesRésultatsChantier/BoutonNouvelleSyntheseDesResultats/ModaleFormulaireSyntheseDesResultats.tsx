import { FunctionComponent, ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Modale } from "@/components/shared/Modale";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import SynthèseDesRésultatsAffichage from "@/components/PageChantier/SynthèseDesRésultatsChantier/Affichage/Affichage";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import {
  LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
  validationSynthèseDesRésultatsFormulaire,
} from "@/validation/synthèseDesRésultats";
import { SelecteurMeteo } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SelecteurMeteo";
import { SyntheseDesResultatsFormulaireInputs } from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire.interface";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { SaveIcon } from "@/components/_commons/Icones/SaveIcon";
import { MétéoSaisissable } from "@/server/domain/météo/Météo.interface";

interface ModaleFormulaireSyntheseDesResultatsProps {
  title: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPublier: SubmitHandler<SyntheseDesResultatsFormulaireInputs>;
  onBrouillon: SubmitHandler<SyntheseDesResultatsFormulaireInputs>;
}

export const ModaleFormulaireSyntheseDesResultats: FunctionComponent<
  ModaleFormulaireSyntheseDesResultatsProps
> = ({ title, trigger, open, onOpenChange, onPublier, onBrouillon }) => {
  const { syntheseDesResultats, syntheseDesResultatsBrouillon } =
    pageChantier.useServerSidePropsContext();

  const form = useForm<SyntheseDesResultatsFormulaireInputs>({
    mode: "all",
    resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
    ...(syntheseDesResultatsBrouillon
      ? {
          defaultValues: { contenu: "", meteo: undefined },
          values: {
            contenu: syntheseDesResultatsBrouillon.contenu,
            meteo: syntheseDesResultatsBrouillon.meteo as MétéoSaisissable,
          },
        }
      : { defaultValues: { contenu: "", meteo: undefined } }),
  });

  return (
    <Modale
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      trigger={trigger}
    >
      <p className="text-sm text-dsfr-mention-grey mb-6">
        Veuillez saisir ci-dessous le nouveau commentaire relatif à la météo et
        à la synthèse des résultats. Après publication, le nouveau commentaire
        sera affiché et l'ancien commentaire sera archivé dans l'historique des
        commentaires.
      </p>

      <h3 className="text-base font-bold mb-3">Commentaire actuel</h3>
      <div className="flex gap-4 mb-6">
        <div className="flex-none w-55 flex flex-col gap-4 items-center">
          <MétéoBadge météo={syntheseDesResultats?.meteo ?? "NON_RENSEIGNEE"} />
          {syntheseDesResultats ? (
            <MeteoPicto meteo={syntheseDesResultats.meteo} />
          ) : null}
        </div>
        <div>
          <SynthèseDesRésultatsAffichage
            itemHistoriqueSyntheseDesResultats={syntheseDesResultats}
          />
        </div>
      </div>

      <h3 className="text-base font-bold mb-3">Votre nouveau commentaire</h3>
      <form onSubmit={form.handleSubmit(onPublier)}>
        <div className="flex gap-4 items-stretch">
          <div className="flex-none w-55">
            <label className="block text-sm mb-2">Météo</label>
            <Controller
              control={form.control}
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
            className={`flex-1 flex flex-col ${form.formState.errors.contenu ? "fr-input-group--error" : ""}`}
          >
            <label className="block text-sm mb-2">Synthèse des résultats</label>
            <textarea
              className="fr-input fr-text--sm flex-1"
              rows={6}
              {...form.register("contenu")}
            />
            <div className="flex justify-between mt-1">
              <div>
                {!!form.formState.errors.contenu && (
                  <p className="fr-error-text mt-0">
                    {form.formState.errors.contenu.message}
                  </p>
                )}
              </div>
              <CompteurCaractères
                compte={form.watch("contenu")?.length ?? 0}
                limiteDeCaractères={LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 mt-6">
          <Bouton
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
            }
            label="Publier"
            type="submit"
            variant="primary"
          />
          <Dialog.Close asChild>
            <Bouton
              iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
              label="Annuler"
              type="button"
              variant="secondary"
            />
          </Dialog.Close>
          <BoutonSousLigné
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
            }
            onClick={form.handleSubmit(onBrouillon)}
            type="button"
          >
            Enregistrer en tant que brouillon
          </BoutonSousLigné>
        </div>
      </form>
    </Modale>
  );
};
