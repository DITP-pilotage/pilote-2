import { useRouter } from "next/router";
import { FormProvider } from "react-hook-form";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataAxe } from "@/server/metadataAxe/queries/RecupererAxeQuery";
import {
  AxeForm,
  defaultAxeVide,
  useAxeForm,
} from "@/components/PageAdminAxes/useAxeForm";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";

interface Props {
  axeId: string;
  estUneCréation: boolean;
  axeData: MetadataAxe | null;
}

const PageAdminAxeEdition = ({ axeId, estUneCréation, axeData }: Props) => {
  const router = useRouter();

  const defaultValues: AxeForm = axeData
    ? {
        axeId: axeData.axeId,
        axeName: axeData.axeName,
        axeDesc: axeData.axeDesc,
        estUneCréation: false,
      }
    : defaultAxeVide();

  const { reactHookForm, enregistrer, alerte, isPending } = useAxeForm({
    defaultValues,
    axeId,
    estUneCréation,
  });

  const archiverMutation = api.metadataAxe.archiver.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels-deprecies/axes/${axeId}?_action=modification-reussie`,
      ),
  });

  const restorerMutation = api.metadataAxe.restorer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels-deprecies/axes/${axeId}?_action=modification-reussie`,
      ),
  });

  const estSupprime = axeData?.deletedAt != null;

  const { data: utilisation } = api.metadataAxe.verifierUtilisation.useQuery(
    { axeId },
    { enabled: !estUneCréation && !estSupprime },
  );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation ? "Nouvel axe" : `Axe ${axeId}`;

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

        {succès && (
          <Alerte
            classesSupplementaires="mb-6"
            message="Axe enregistré avec succès."
            type="succès"
          />
        )}
        {alerte && (
          <Alerte
            classesSupplementaires="mb-6"
            titre={alerte.titre}
            type="erreur"
          />
        )}
        {!estUneCréation && !estSupprime && estUtilisé && (
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
                  {estUneCréation ? "Nouvel axe" : "Édition"}
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
                              axeId,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              axeId,
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
                    <Input<AxeForm>
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
                  <Input<AxeForm>
                    control={reactHookForm.control}
                    label="Nom"
                    name="axeName"
                    required
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Description</SectionTitle>
                <Textarea<AxeForm>
                  control={reactHookForm.control}
                  label="Description"
                  name="axeDesc"
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

export default PageAdminAxeEdition;
