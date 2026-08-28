import { useRouter } from "next/router";
import { Controller, FormProvider } from "react-hook-form";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataZonegroup } from "@/server/metadataZonegroup/queries/RecupererZonegroupQuery";
import {
  defaultZonegroupVide,
  ZonegroupForm,
  useZonegroupForm,
} from "@/components/PageAdminZonegroups/useZonegroupForm";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { SélecteurZones } from "@/components/PageAdminZonegroups/SélecteurZones";

interface Props {
  zoneGroupId: string;
  estUneCréation: boolean;
  zonegroupData: MetadataZonegroup | null;
  idSuivant: string | null;
}

const PageAdminZonegroupEdition = ({
  zoneGroupId,
  estUneCréation,
  zonegroupData,
  idSuivant,
}: Props) => {
  const router = useRouter();
  const zoneGroupIdEffectif = estUneCréation
    ? (idSuivant ?? zoneGroupId)
    : zoneGroupId;

  const defaultValues: ZonegroupForm = zonegroupData
    ? {
        zoneGroupId: zonegroupData.zoneGroupId,
        zoneGroupName: zonegroupData.zgName,
        zoneGroupDesc: zonegroupData.zgDesc,
        zoneGroupZones: zonegroupData.zgZones,
      }
    : defaultZonegroupVide(zoneGroupIdEffectif);

  const { reactHookForm, enregistrer, alerte, isPending } = useZonegroupForm({
    defaultValues,
    zoneGroupId: zoneGroupIdEffectif,
    estUneCréation,
  });

  const archiverMutation = api.metadataZonegroup.archiver.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels/zonegroups/${zoneGroupIdEffectif}?_action=modification-reussie`,
      ),
  });

  const restorerMutation = api.metadataZonegroup.restorer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels/zonegroups/${zoneGroupIdEffectif}?_action=modification-reussie`,
      ),
  });

  const estSupprime = zonegroupData?.deletedAt != null;

  const { data: utilisation } =
    api.metadataZonegroup.verifierUtilisation.useQuery(
      { zoneGroupId: zoneGroupIdEffectif },
      { enabled: !estUneCréation && !estSupprime },
    );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const { data: zonesDisponibles = [] } =
    api.metadataZonegroup.listerZonesDisponibles.useQuery();

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau groupe - ${zoneGroupIdEffectif}`
    : `Groupe ${zoneGroupId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Zones groupes",
              lien: "/panel-administrateur/referentiels/zonegroups",
            },
          ]}
          libelléPageCourante={titre}
        />

        {succès && (
          <Alerte
            classesSupplementaires="mb-6"
            message="Zone groupe enregistré avec succès."
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
            titre={`Cette zone-groupe est associée à ${utilisation?.nombreChantiers} chantier(s) et ${utilisation?.nombreIndicateurs} indicateur(s) et ne peut pas être supprimée.`}
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
                  {estUneCréation ? "Nouveau groupe de zones" : "Édition"}
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
                              zoneGroupId: zoneGroupIdEffectif,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              zoneGroupId: zoneGroupIdEffectif,
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
                  <div>
                    <span className="block text-xs text-dsfr-grey-625 mb-1">
                      ID
                    </span>
                    <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                      {zoneGroupIdEffectif}
                    </p>
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations</SectionTitle>
                <div className="flex flex-col gap-4">
                  <Input<ZonegroupForm>
                    control={reactHookForm.control}
                    label="Nom"
                    name="zoneGroupName"
                    required
                  />
                  <Textarea<ZonegroupForm>
                    control={reactHookForm.control}
                    label="Description"
                    name="zoneGroupDesc"
                    rows={3}
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Zones</SectionTitle>
                <Controller
                  control={reactHookForm.control}
                  name="zoneGroupZones"
                  render={({ field }) => (
                    <SélecteurZones
                      error={
                        reactHookForm.formState.errors.zoneGroupZones?.message
                      }
                      onChange={field.onChange}
                      value={field.value}
                      zonesDisponibles={zonesDisponibles}
                    />
                  )}
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

export default PageAdminZonegroupEdition;
