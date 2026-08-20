import { useRouter } from "next/router";
import Link from "next/link";
import { Controller, FormProvider } from "react-hook-form";
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
        zgName: zonegroupData.zgName,
        zgDesc: zonegroupData.zgDesc,
        zgZones: zonegroupData.zgZones,
      }
    : defaultZonegroupVide(zoneGroupIdEffectif);

  const { reactHookForm, enregistrer, alerte, isPending } = useZonegroupForm({
    defaultValues,
    zoneGroupId: zoneGroupIdEffectif,
    estUneCréation,
  });

  const suppressionMutation = api.metadataZonegroup.supprimer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels/zonegroups/${zoneGroupIdEffectif}?_action=modification-reussie`,
      ),
  });

  const estSupprimé =
    zonegroupData?.deletedAt !== null && zonegroupData?.deletedAt !== undefined;

  const { data: zonesDisponibles = [] } =
    api.metadataZonegroup.listerZonesDisponibles.useQuery();

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau groupe — ${zoneGroupIdEffectif}`
    : `Groupe ${zoneGroupId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-primary hover:text-dsfr-blue-france-sun-113-hover font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/referentiels/zonegroups"
          >
            Zones groupes
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{titre}</span>
        </nav>

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
                <h1 className="text-3xl font-bold text-gray-900">{titre}</h1>
              </div>
              <div className="flex items-center gap-3">
                {!estUneCréation && (
                  <Bouton
                    className={
                      estSupprimé
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    }
                    label={estSupprimé ? "Restaurer" : "Supprimer"}
                    onClick={() =>
                      suppressionMutation.mutate({
                        csrf: récupérerUnCookie("csrf") ?? "",
                        zoneGroupId: zoneGroupIdEffectif,
                        restaurer: estSupprimé,
                      })
                    }
                    type="button"
                  />
                )}
                <Bouton
                  disabled={isPending}
                  label={estUneCréation ? "Créer" : "Sauvegarder"}
                  type="submit"
                  variant="primary"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden divide-y divide-gray-100">
              <section className="px-6 py-8">
                <SectionTitle>Identification</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">ID</span>
                    <p className="px-3 py-2 text-sm font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-sm">
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
                    name="zgName"
                    required
                  />
                  <Textarea<ZonegroupForm>
                    control={reactHookForm.control}
                    label="Description"
                    name="zgDesc"
                    rows={3}
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Zones</SectionTitle>
                <Controller
                  control={reactHookForm.control}
                  name="zgZones"
                  render={({ field }) => (
                    <SélecteurZones
                      error={reactHookForm.formState.errors.zgZones?.message}
                      onChange={field.onChange}
                      value={field.value}
                      zonesDisponibles={zonesDisponibles}
                    />
                  )}
                />
              </section>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
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
