import { $Enums } from "@prisma/client";
import { Controller, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { MetadataPorteur } from "@/server/metadataPorteur/queries/RecupererPorteurQuery";
import {
  defaultPorteurVide,
  PorteurForm,
  usePorteurForm,
} from "@/components/PageAdminPorteurs/usePorteurForm";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";
import type { SélecteurOption } from "@/client/components/_commons/Sélecteur/Sélecteur.interface";

interface Props {
  porteurId: string;
  estUneCréation: boolean;
  porteurData: MetadataPorteur | null;
  idSuivant: string | null;
}

const OPTIONS_TYPE: SélecteurOption<$Enums.porteur_type>[] = [
  { libellé: "Ministère (MIN)", valeur: "MIN" },
  { libellé: "Direction d'Administration Centrale (DAC)", valeur: "DAC" },
  { libellé: "Délégation interministérielle (DI)", valeur: "DI" },
  { libellé: "Autre", valeur: "AUTRE" },
];

const PageAdminPorteurEdition = ({
  porteurId,
  estUneCréation,
  porteurData,
  idSuivant,
}: Props) => {
  const refreshRouter = useRefreshRouter();
  const porteurIdEffectif = estUneCréation
    ? (idSuivant ?? porteurId)
    : porteurId;

  const defaultValues: PorteurForm = porteurData
    ? {
        porteurId: porteurData.porteurId,
        porteurShort: porteurData.porteurShort,
        porteurName: porteurData.porteurName,
        porteurDesc: porteurData.porteurDesc,
        porteurType: porteurData.porteurType ?? "MIN",
        porteurDirecteur: porteurData.porteurDirecteur,
        porteurPicto: porteurData.porteurPicto,
      }
    : defaultPorteurVide(porteurIdEffectif);

  const { reactHookForm, enregistrer, isPending } = usePorteurForm({
    defaultValues,
    estUneCréation,
  });

  const archiverMutation = api.metadataPorteur.archiver.useMutation({
    onSuccess: () => {
      toast.success("Porteur archivé avec succès.", {
        position: "top-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const restorerMutation = api.metadataPorteur.restorer.useMutation({
    onSuccess: () => {
      toast.success("Porteur restauré avec succès.", {
        position: "top-right",
        richColors: true,
      });
      void refreshRouter();
    },
  });

  const estSupprime = porteurData?.deletedAt != null;

  const { data: utilisation } =
    api.metadataPorteur.verifierUtilisation.useQuery(
      { porteurId: porteurIdEffectif },
      { enabled: !estUneCréation && !estSupprime },
    );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const titre = estUneCréation
    ? `Nouveau porteur - ${porteurIdEffectif}`
    : `Porteur ${porteurId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Porteurs",
              lien: "/panel-administrateur/referentiels/porteurs",
            },
          ]}
          libelléPageCourante={titre}
        />

        {!estUneCréation && !estSupprime && estUtilisé && (
          <Alerte
            classesSupplementaires="mb-6"
            titre={`Ce porteur est associé à ${utilisation?.nombrePerimetres} périmètre(s) et ${utilisation?.nombreChantiers} chantier(s) et ne peut pas être supprimé.`}
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
                  {estUneCréation ? "Nouveau porteur" : "Édition"}
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
                              porteurId: porteurIdEffectif,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              porteurId: porteurIdEffectif,
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="block text-xs text-dsfr-grey-625 mb-1">
                      ID
                    </span>
                    <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                      {porteurIdEffectif}
                    </p>
                  </div>
                  <Input<PorteurForm>
                    control={reactHookForm.control}
                    label="Sigle"
                    name="porteurShort"
                    required
                  />
                  <Controller
                    control={reactHookForm.control}
                    name="porteurType"
                    render={({ field }) => (
                      <Sélecteur
                        htmlName="porteurType"
                        libellé="Type"
                        onChange={field.onChange}
                        options={OPTIONS_TYPE}
                        valeurSélectionnée={field.value}
                      />
                    )}
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Dénomination</SectionTitle>
                <div className="flex flex-col gap-4">
                  <Input<PorteurForm>
                    control={reactHookForm.control}
                    label="Nom complet"
                    name="porteurName"
                    required
                  />
                  <Textarea<PorteurForm>
                    control={reactHookForm.control}
                    label="Description"
                    name="porteurDesc"
                    rows={3}
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations complémentaires</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <Input<PorteurForm>
                    control={reactHookForm.control}
                    label="Directeur"
                    name="porteurDirecteur"
                  />
                  <Input<PorteurForm>
                    control={reactHookForm.control}
                    label="Picto (code)"
                    name="porteurPicto"
                  />
                </div>
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

export default PageAdminPorteurEdition;
