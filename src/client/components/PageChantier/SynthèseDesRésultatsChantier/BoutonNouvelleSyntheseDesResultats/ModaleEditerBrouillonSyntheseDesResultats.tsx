import { FunctionComponent, PropsWithChildren, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsStringLiteral, useQueryState } from "nuqs";
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
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { récupérerUnCookie } from "@/client/utils/cookies";
import api from "@/server/infrastructure/api/trpc/api";
import { MétéoSaisissable } from "@/server/domain/météo/Météo.interface";

export const ModaleEditerBrouillonSyntheseDesResultats: FunctionComponent<
  PropsWithChildren
> = ({ children }) => {
  const { syntheseDesResultats, chantier, territoireCode } =
    pageChantier.useServerSidePropsContext();
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();
  const [, setAction] = useQueryState(
    "_action",
    parseAsStringLiteral(["creation-reussie", ""]).withDefault("").withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const publierUnBrouillonMutation =
    api.synthèseDesRésultats.publierUnBrouillon.useMutation();

  const modifierLeBrouillonMutation =
    api.synthèseDesRésultats.modifierLeBrouillon.useMutation();

  const { data: brouillon } =
    api.synthèseDesRésultats.recupererDernierBrouillon.useQuery(
      { réformeId: chantier.id, territoireCode },
      { enabled: open },
    );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
  } = useForm<SyntheseDesResultatsFormulaireInputs>({
    mode: "all",
    resolver: zodResolver(validationSynthèseDesRésultatsFormulaire),
    values: brouillon
      ? {
          contenu: brouillon.contenu,
          meteo: brouillon.meteo as MétéoSaisissable,
        }
      : undefined,
  });

  return (
    <Modale
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
      open={open}
      title="Editer un brouillon"
      trigger={children}
    >
      <p className="text-sm text-dsfr-mention-grey mb-6">
        Veuillez saisir ci-dessous le nouveau commentaire relatif à la météo et
        à la synthèse des résultats. Après publication, le nouveau commentaire
        sera affiché et l&apos;ancien commentaire sera archivé dans
        l&apos;historique des commentaires.
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
      {brouillon && (
        <form
          onSubmit={handleSubmit((data) =>
            publierUnBrouillonMutation.mutateAsync(
              {
                brouillon,
                contenu: data.contenu,
                meteo: data.meteo,
                csrf: récupérerUnCookie("csrf") ?? "",
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  refreshRouter();
                  await setAction("creation-reussie");
                },
              },
            ),
          )}
        >
          <div className="flex gap-4 items-stretch">
            <div className="flex-none w-55">
              <label className="block text-sm mb-2">Météo</label>
              <Controller
                control={control}
                name="meteo"
                render={({ field }) => (
                  <SelecteurMeteo
                    onChange={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </div>
            <div
              className={`flex-1 flex flex-col ${errors.contenu ? "fr-input-group--error" : ""}`}
            >
              <label className="block text-sm mb-2">
                Synthèse des résultats
              </label>
              <textarea
                className="fr-input fr-text--sm flex-1"
                rows={6}
                {...register("contenu")}
              />
              <div className="flex justify-between mt-1">
                <div>
                  {!!errors.contenu && (
                    <p className="fr-error-text mt-0">
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
          <div className="flex justify-end items-center gap-3 mt-6">
            <Bouton
              disabled={!isValid}
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
              }
              label="Publier"
              type="submit"
              variant="primary"
            />
            <Bouton
              iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
              label="Annuler"
              type="button"
              variant="secondary"
            />

            <BoutonSousLigné
              disabled={!isValid}
              iconLeft={
                <Icone className="w-4 h-4 text-current" icone={SaveIcon} />
              }
              onClick={handleSubmit((data) =>
                modifierLeBrouillonMutation.mutateAsync(
                  {
                    brouillon,
                    contenu: data.contenu,
                    meteo: data.meteo,
                    csrf: récupérerUnCookie("csrf") ?? "",
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      refreshRouter();
                    },
                  },
                ),
              )}
              type="button"
            >
              Enregistrer en tant que brouillon
            </BoutonSousLigné>
          </div>
        </form>
      )}
    </Modale>
  );
};
