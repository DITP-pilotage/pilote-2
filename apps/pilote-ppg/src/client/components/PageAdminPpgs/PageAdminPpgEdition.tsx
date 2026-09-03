import { Controller, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { MetadataPpg } from "@/server/metadataPpg/queries/RecupererPpgQuery";
import {
  defaultPpgVide,
  PpgForm,
  usePpgForm,
} from "@/components/PageAdminPpgs/usePpgForm";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";

interface Props {
  ppgId: string;
  estUneCréation: boolean;
  ppgData: MetadataPpg | null;
}

const PageAdminPpgEdition = ({ ppgId, estUneCréation, ppgData }: Props) => {
  const refreshRouter = useRefreshRouter();

  const defaultValues: PpgForm = ppgData
    ? {
        ppgId: ppgData.ppgId,
        ppgNom: ppgData.ppgNom,
        ppgDesc: ppgData.ppgDesc,
        ppgAxe: ppgData.ppgAxe,
        estUneCréation: false,
      }
    : defaultPpgVide();

  const { reactHookForm, enregistrer, isPending } = usePpgForm({
    defaultValues,
    estUneCréation,
  });

  const { data: axes = [] } = api.metadataAxe.lister.useQuery();
  const axesActifs = axes.filter((axe) => axe.deletedAt === null);

  const archiverMutation = api.metadataPpg.archiver.useMutation({
    onSuccess: () => {
      toast.success("PPG archivé avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const restorerMutation = api.metadataPpg.restorer.useMutation({
    onSuccess: () => {
      toast.success("PPG restauré avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const estSupprime = ppgData?.deletedAt != null;

  const { data: utilisation } = api.metadataPpg.verifierUtilisation.useQuery(
    { ppgId },
    { enabled: !estUneCréation && !estSupprime },
  );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const titre = estUneCréation ? "Nouveau PPG" : `PPG ${ppgId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "PPG",
              lien: "/panel-administrateur/referentiels-deprecies/ppgs",
            },
          ]}
          libelléPageCourante={titre}
        />

        {!estUneCréation && !estSupprime && estUtilisé && (
          <Alerte
            classesSupplementaires="mb-6"
            titre={`Ce PPG est associé à ${utilisation?.nombreChantiers} chantier(s) et ne peut pas être supprimé.`}
            type="warning"
          />
        )}

        <FormProvider {...reactHookForm}>
          <form
            method="post"
            onSubmit={reactHookForm.handleSubmit(enregistrer)}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
                  {estUneCréation ? "Nouveau PPG" : "Édition"}
                </p>
                <h1 className="text-3xl font-bold text-dsfr-grey-200">
                  {titre}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {!estUneCréation && (
                  <div className="flex items-center gap-2">
                    <Bouton
                      className={
                        estSupprime
                          ? "bg-pilote-vert text-white hover:bg-success"
                          : "bg-dsfr-warning-950 text-error border border-dsfr-warning-925 hover:bg-dsfr-warning-925 disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                      disabled={!estSupprime && estUtilisé}
                      label={estSupprime ? "Restaurer" : "Supprimer"}
                      onClick={() =>
                        estSupprime
                          ? restorerMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              ppgId,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              ppgId,
                            })
                      }
                      variant="primary"
                      type="button"
                    />
                  </div>
                )}
                <Bouton
                  disabled={isPending}
                  label={estUneCréation ? "Créer" : "Sauvegarder"}
                  type="submit"
                  variant="primary"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-900 overflow-hidden divide-y divide-dsfr-grey-925">
              <section className="px-6 py-8">
                <SectionTitle>Identification</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  {estUneCréation ? (
                    <Input<PpgForm>
                      control={reactHookForm.control}
                      label="ID"
                      name="ppgId"
                      required
                    />
                  ) : (
                    <div>
                      <span className="block text-xs text-dsfr-grey-625 mb-1">
                        ID
                      </span>
                      <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                        {ppgId}
                      </p>
                    </div>
                  )}
                  <Input<PpgForm>
                    control={reactHookForm.control}
                    label="Nom"
                    name="ppgNom"
                    required
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Classification</SectionTitle>
                <Controller
                  control={reactHookForm.control}
                  name="ppgAxe"
                  render={({ field }) => (
                    <Sélecteur
                      htmlName="ppgAxe"
                      libellé="Axe"
                      onChange={(valeur) => field.onChange(valeur || null)}
                      options={[
                        { libellé: "Aucun axe", valeur: "" },
                        ...axesActifs.map((axe) => ({
                          libellé: `${axe.axeId} — ${axe.axeName}`,
                          valeur: axe.axeId,
                        })),
                      ]}
                      valeurSélectionnée={field.value ?? ""}
                    />
                  )}
                />
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Description</SectionTitle>
                <Textarea<PpgForm>
                  control={reactHookForm.control}
                  label="Description"
                  name="ppgDesc"
                  rows={3}
                />
              </section>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
              <Bouton
                disabled={isPending}
                label={estUneCréation ? "Créer" : "Sauvegarder"}
                type="submit"
                variant="primary"
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default PageAdminPpgEdition;
