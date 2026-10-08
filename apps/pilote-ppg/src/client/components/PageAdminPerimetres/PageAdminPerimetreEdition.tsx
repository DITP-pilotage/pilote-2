import { Controller, FormProvider } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { FormTextField } from "@/components/shared/FormTextField";
import {
  SelectField,
  type SelectFieldOption,
} from "@/components/shared/SelectField";
import { Button } from "@/components/shared/Button";
import { toast } from "sonner";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { MetadataPerimetre } from "@/server/referentiels/perimetre/queries/GetPerimetreQuery";
import {
  defaultPerimetreVide,
  PerimetreForm,
  usePerimetreForm,
} from "@/components/PageAdminPerimetres/usePerimetreForm";
import { SectionTitle } from "@/components/shared/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";

interface Props {
  perimetreId: string;
  isCreation: boolean;
  perimetreData: MetadataPerimetre | null;
  idSuivant: string | null;
}

const PageAdminPerimetreEdition = ({
  perimetreId,
  isCreation,
  perimetreData,
  idSuivant,
}: Props) => {
  const refreshRouter = useRefreshRouter();
  const perimetreIdEffectif = isCreation
    ? (idSuivant ?? perimetreId)
    : perimetreId;

  const defaultValues: PerimetreForm = perimetreData
    ? {
        perimetreId: perimetreData.perimetreId,
        perimetreNom: perimetreData.perNom,
        perimetrePorteurId: perimetreData.perPorteurId,
      }
    : defaultPerimetreVide(perimetreIdEffectif);

  const { reactHookForm, enregistrer, isPending } = usePerimetreForm({
    defaultValues,
    isCreation,
  });

  const archiverMutation = api.referentielPerimetre.archive.useMutation({
    onSuccess: () => {
      toast.success("Périmètre archivé avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const restaurerMutation = api.referentielPerimetre.restore.useMutation({
    onSuccess: () => {
      toast.success("Périmètre restauré avec succès.", {
        position: "bottom-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const estSupprimé = perimetreData?.deletedAt != null;

  const { data: utilisation } = api.referentielPerimetre.checkUsage.useQuery(
    { perimetreId: perimetreIdEffectif },
    { enabled: !isCreation && !estSupprimé },
  );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const { data: porteurs = [] } = api.referentielPorteur.list.useQuery();
  const porteursActifs = porteurs.filter((p) => p.deletedAt === null);
  const optionsPorteurs: SelectFieldOption<string>[] = [
    { libelle: "- Aucun -", valeur: "" },
    ...porteursActifs.map((porteur) => ({
      libelle: `${porteur.porteurShort} - ${porteur.porteurName}`,
      valeur: porteur.porteurId,
    })),
  ];

  const titre = isCreation
    ? `Nouveau périmètre - ${perimetreIdEffectif}`
    : `Périmètre ${perimetreId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Périmètres",
              lien: "/panel-administrateur/referentiels/perimetres",
            },
          ]}
          libelléPageCourante={titre}
        />

        {!isCreation && !estSupprimé && estUtilisé && (
          <Alerte
            classesSupplementaires="mb-6"
            titre={`Ce périmètre est associé à ${utilisation?.nombreChantiers} chantier(s) et ne peut pas être supprimé.`}
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
                  {isCreation ? "Nouveau périmètre" : "Édition"}
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
                        estSupprimé
                          ? "bg-pilote-vert text-white hover:bg-success"
                          : "bg-dsfr-warning-950 text-error border border-dsfr-warning-925 hover:bg-dsfr-warning-925 disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                      disabled={!estSupprimé && estUtilisé}
                      onClick={() =>
                        estSupprimé
                          ? restaurerMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              perimetreId: perimetreIdEffectif,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              perimetreId: perimetreIdEffectif,
                            })
                      }
                      variant="primary"
                      type="button"
                    >
                      {estSupprimé ? "Restaurer" : "Supprimer"}
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
                  <div>
                    <span className="block text-xs text-dsfr-grey-625 mb-1">
                      ID
                    </span>
                    <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                      {perimetreIdEffectif}
                    </p>
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations</SectionTitle>
                <div className="flex flex-col gap-4">
                  <FormTextField<PerimetreForm>
                    control={reactHookForm.control}
                    label="Nom"
                    name="perimetreNom"
                    required
                  />
                  <Controller
                    control={reactHookForm.control}
                    name="perimetrePorteurId"
                    render={({ field }) => (
                      <SelectField
                        className={FIELD_GROUP_SPACING}
                        name="perimetrePorteurId"
                        label="Porteur"
                        onChange={(val) => field.onChange(val || null)}
                        options={optionsPorteurs}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </div>
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

export default PageAdminPerimetreEdition;
