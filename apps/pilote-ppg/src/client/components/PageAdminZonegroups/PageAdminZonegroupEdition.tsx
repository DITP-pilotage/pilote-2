import { useState } from "react";
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

interface Props {
  zoneGroupId: string;
  estUneCréation: boolean;
  zonegroupData: MetadataZonegroup | null;
  idSuivant: string | null;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold text-[#1e1e1e] uppercase tracking-wide border-l-[3px] border-[#000091] pl-3 mb-5">
    {children}
  </h2>
);

const LABELS_TYPE: Record<string, string> = {
  NAT: "National",
  REG: "Région",
  DEPT: "Département",
};

const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-[#000091]";
const errorClass = "mt-1 text-xs text-red-600";

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
  const [filtreZone, setFiltreZone] = useState("");

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
  const zonesGroupées = zonesDisponibles.reduce<
    Record<string, typeof zonesDisponibles>
  >((acc, zone) => {
    const type = zone.zoneType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(zone);
    return acc;
  }, {});
  const ordreTypes = ["NAT", "REG", "DEPT"];

  const {
    register,
    control,
    formState: { errors },
  } = reactHookForm;

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau groupe — ${zoneGroupIdEffectif}`
    : `Groupe ${zoneGroupId}`;

  return (
    <div className="min-h-screen bg-[#f5f5fe]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-[#000091] hover:text-[#1212ff] font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/referentiels/zonegroups"
          >
            Zones groupes
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{titre}</span>
        </nav>

        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Zone groupe enregistré avec succès.
          </div>
        )}
        {alerte && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm font-medium">
            {alerte.titre}
          </div>
        )}

        <FormProvider {...reactHookForm}>
          <form
            method="post"
            onSubmit={reactHookForm.handleSubmit(enregistrer)}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-[#000091] uppercase tracking-widest mb-1">
                  {estUneCréation ? "Nouveau groupe de zones" : "Édition"}
                </p>
                <h1 className="text-3xl font-bold text-[#1e1e1e]">{titre}</h1>
              </div>
              <div className="flex items-center gap-3">
                {!estUneCréation && (
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                      estSupprimé
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    }`}
                    onClick={() =>
                      suppressionMutation.mutate({
                        csrf: récupérerUnCookie("csrf") ?? "",
                        zoneGroupId: zoneGroupIdEffectif,
                        restaurer: estSupprimé,
                      })
                    }
                    type="button"
                  >
                    {estSupprimé ? "Restaurer" : "Supprimer"}
                  </button>
                )}
                <button
                  className="px-5 py-2.5 bg-[#000091] text-white rounded-sm text-sm font-medium hover:bg-[#1212ff] transition-colors disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  {estUneCréation ? "Créer" : "Sauvegarder"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden divide-y divide-gray-100">
              <section className="px-6 py-8">
                <SectionTitle>Identification</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={labelClass}>ID</span>
                    <p className="px-3 py-2 text-sm font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-sm">
                      {zoneGroupIdEffectif}
                    </p>
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations</SectionTitle>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass} htmlFor="zgName">
                      Nom *
                    </label>
                    <input
                      className={inputClass}
                      id="zgName"
                      maxLength={200}
                      type="text"
                      {...register("zgName")}
                    />
                    {errors.zgName && (
                      <p className={errorClass}>{errors.zgName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="zgDesc">
                      Description
                    </label>
                    <textarea
                      className={inputClass}
                      id="zgDesc"
                      rows={3}
                      {...register("zgDesc")}
                    />
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Zones</SectionTitle>
                <Controller
                  control={control}
                  name="zgZones"
                  render={({ field }) => (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">
                          {field.value.length} zone
                          {field.value.length !== 1 ? "s" : ""} sélectionnée
                          {field.value.length !== 1 ? "s" : ""}
                        </p>
                        <input
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#000091] w-64"
                          onChange={(e) => setFiltreZone(e.target.value)}
                          placeholder="Filtrer les zones…"
                          type="search"
                          value={filtreZone}
                        />
                      </div>
                      <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-sm p-4">
                        {ordreTypes.map((type) => {
                          const zones = (zonesGroupées[type] ?? []).filter(
                            (zone) =>
                              !filtreZone ||
                              zone.zoneId
                                .toLowerCase()
                                .includes(filtreZone.toLowerCase()) ||
                              zone.nom
                                .toLowerCase()
                                .includes(filtreZone.toLowerCase()),
                          );
                          if (zones.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {LABELS_TYPE[type] ?? type}
                                </h4>
                                <div className="flex gap-2">
                                  <button
                                    className="text-xs text-[#000091] hover:underline"
                                    onClick={() => {
                                      const ids = zones.map((z) => z.zoneId);
                                      const current = new Set(field.value);
                                      ids.forEach((id) => current.add(id));
                                      field.onChange(Array.from(current));
                                    }}
                                    type="button"
                                  >
                                    Tout cocher
                                  </button>
                                  <button
                                    className="text-xs text-gray-500 hover:underline"
                                    onClick={() => {
                                      const ids = new Set(
                                        zones.map((z) => z.zoneId),
                                      );
                                      field.onChange(
                                        field.value.filter(
                                          (id) => !ids.has(id),
                                        ),
                                      );
                                    }}
                                    type="button"
                                  >
                                    Tout décocher
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {zones.map((zone) => (
                                  <label
                                    className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm"
                                    key={zone.zoneId}
                                  >
                                    <input
                                      checked={field.value.includes(
                                        zone.zoneId,
                                      )}
                                      className="rounded border-gray-300 text-[#000091] focus:ring-[#000091]"
                                      onChange={(e) => {
                                        field.onChange(
                                          e.target.checked
                                            ? [...field.value, zone.zoneId]
                                            : field.value.filter(
                                                (id) => id !== zone.zoneId,
                                              ),
                                        );
                                      }}
                                      type="checkbox"
                                    />
                                    <span className="font-mono text-xs text-gray-500 w-12 shrink-0">
                                      {zone.zoneId}
                                    </span>
                                    <span className="text-gray-700 truncate">
                                      {zone.nom}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {errors.zgZones && (
                        <p className={errorClass}>{errors.zgZones.message}</p>
                      )}
                    </div>
                  )}
                />
              </section>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                className="px-5 py-2.5 bg-[#000091] text-white rounded-sm text-sm font-medium hover:bg-[#1212ff] transition-colors disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {estUneCréation ? "Créer" : "Sauvegarder"}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default PageAdminZonegroupEdition;
