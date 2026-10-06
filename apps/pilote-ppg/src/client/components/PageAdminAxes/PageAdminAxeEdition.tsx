import { FormProvider } from "react-hook-form";
import {
  FormTextField,
  FormTextareaField,
} from "@/components/shared/FormTextField";
import { Button } from "@/components/shared/Button";
import { toast } from "sonner";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { MetadataAxe } from "@/server/referentiels/axe/queries/GetAxeQuery";
import {
  AxeForm,
  defaultAxeVide,
  useAxeForm,
} from "@/components/PageAdminAxes/useAxeForm";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";

interface Props {
  axeId: string;
  isCreation: boolean;
  axeData: MetadataAxe | null;
}

const PageAdminAxeEdition = ({ axeId, isCreation, axeData }: Props) => {
  const refreshRouter = useRefreshRouter();

  const defaultValues: AxeForm = axeData
    ? {
        axeId: axeData.axeId,
        axeName: axeData.axeName,
        axeDesc: axeData.axeDesc,
        isCreation: false,
      }
    : defaultAxeVide();

  const { reactHookForm, enregistrer, isPending } = useAxeForm({
    defaultValues,
    isCreation,
  });

  const archiverMutation = api.metadataAxe.archive.useMutation({
    onSuccess: () => {
      toast.success("Axe archivé avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const restaurerMutation = api.metadataAxe.restore.useMutation({
    onSuccess: () => {
      toast.success("Axe restauré avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const estSupprime = axeData?.deletedAt != null;

  const { data: utilisation } = api.metadataAxe.checkUsage.useQuery(
    { axeId },
    { enabled: !isCreation && !estSupprime },
  );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const titre = isCreation ? "Nouvel axe" : `Axe ${axeId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Axes",
              lien: "/panel-administrateur/referentiels-deprecies/axes",
            },
          ]}
          libelléPageCourante={titre}
        />

        {!isCreation && !estSupprime && estUtilisé && (
          <Alerte
            classesSupplementaires="mb-6"
            titre={`Cet axe est associé à ${utilisation?.nombrePpgs} PPG et ne peut pas être supprimé.`}
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
                  {isCreation ? "Nouvel axe" : "Édition"}
                </p>
                <h1 className="text-3xl font-bold text-dsfr-grey-200">
                  {titre}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {!isCreation && (
                  <div className="flex items-center gap-2">
                    <Button
                      className={
                        estSupprime
                          ? "bg-pilote-vert text-white hover:bg-success"
                          : "bg-dsfr-warning-950 text-error border border-dsfr-warning-925 hover:bg-dsfr-warning-925 disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                      disabled={!estSupprime && estUtilisé}
                      onClick={() =>
                        estSupprime
                          ? restaurerMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              axeId,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              axeId,
                            })
                      }
                      variant="primary"
                      type="button"
                    >
                      {estSupprime ? "Restaurer" : "Supprimer"}
                    </Button>
                  </div>
                )}
                <Button disabled={isPending} type="submit" variant="primary">
                  {isCreation ? "Créer" : "Sauvegarder"}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-900 overflow-hidden divide-y divide-dsfr-grey-925">
              <section className="px-6 py-8">
                <SectionTitle>Identification</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  {isCreation ? (
                    <FormTextField<AxeForm>
                      control={reactHookForm.control}
                      label="ID"
                      name="axeId"
                      required
                    />
                  ) : (
                    <div>
                      <span className="block text-xs text-dsfr-grey-625 mb-1">
                        ID
                      </span>
                      <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                        {axeId}
                      </p>
                    </div>
                  )}
                  <FormTextField<AxeForm>
                    control={reactHookForm.control}
                    label="Nom"
                    name="axeName"
                    required
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Description</SectionTitle>
                <FormTextareaField<AxeForm>
                  control={reactHookForm.control}
                  label="Description"
                  name="axeDesc"
                  rows={3}
                />
              </section>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
              <Button disabled={isPending} type="submit" variant="primary">
                {isCreation ? "Créer" : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default PageAdminAxeEdition;
