import { useRouter } from "next/router";
import Link from "next/link";
import { Controller, FormProvider } from "react-hook-form";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataPorteur } from "@/server/metadataPorteur/queries/RecupererPorteurQuery";
import {
  defaultPorteurVide,
  PorteurForm,
  usePorteurForm,
} from "@/components/PageAdminPorteurs/usePorteurForm";

interface Props {
  porteurId: string;
  estUneCréation: boolean;
  porteurData: MetadataPorteur | null;
  idSuivant: string | null;
}

const TYPES: { value: "MIN" | "DAC" | "AUTRE"; label: string }[] = [
  { value: "MIN", label: "Ministère (MIN)" },
  { value: "DAC", label: "DAC" },
  { value: "AUTRE", label: "Autre" },
];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold text-[#1e1e1e] uppercase tracking-wide border-l-[3px] border-[#000091] pl-3 mb-5">
    {children}
  </h2>
);

const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-[#000091]";
const errorClass = "mt-1 text-xs text-red-600";

const PageAdminPorteurEdition = ({
  porteurId,
  estUneCréation,
  porteurData,
  idSuivant,
}: Props) => {
  const router = useRouter();
  const porteurIdEffectif = estUneCréation
    ? (idSuivant ?? porteurId)
    : porteurId;

  const defaultValues: PorteurForm = porteurData
    ? {
        porteurId: porteurData.porteurId,
        porteurShort: porteurData.porteurShort,
        porteurName: porteurData.porteurName,
        porteurDesc: porteurData.porteurDesc,
        porteurTypeShort:
          (porteurData.porteurTypeShort as "MIN" | "DAC" | "AUTRE") ?? "MIN",
        porteurDirecteur: porteurData.porteurDirecteur,
        porteurNameShort: porteurData.porteurNameShort,
        porteurPicto: porteurData.porteurPicto,
      }
    : defaultPorteurVide(porteurIdEffectif);

  const { reactHookForm, enregistrer, alerte, isPending } = usePorteurForm({
    defaultValues,
    porteurId: porteurIdEffectif,
    estUneCréation,
  });

  const suppressionMutation = api.metadataPorteur.supprimer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels/porteurs/${porteurIdEffectif}?_action=modification-reussie`,
      ),
  });

  const estSupprimé =
    porteurData?.deletedAt !== null && porteurData?.deletedAt !== undefined;

  const {
    register,
    control,
    formState: { errors },
  } = reactHookForm;

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau porteur — ${porteurIdEffectif}`
    : `Porteur ${porteurId}`;

  return (
    <div className="min-h-screen bg-[#f5f5fe]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-[#000091] hover:text-[#1212ff] font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/referentiels/porteurs"
          >
            Porteurs
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{titre}</span>
        </nav>

        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Porteur enregistré avec succès.
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
                  {estUneCréation ? "Nouveau porteur" : "Édition"}
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
                        porteurId: porteurIdEffectif,
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
                      {porteurIdEffectif}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="porteurTypeShort">
                      Type *
                    </label>
                    <Controller
                      control={control}
                      name="porteurTypeShort"
                      render={({ field }) => (
                        <select
                          className={inputClass}
                          id="porteurTypeShort"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value as "MIN" | "DAC" | "AUTRE",
                            )
                          }
                          value={field.value}
                        >
                          {TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.porteurTypeShort && (
                      <p className={errorClass}>
                        {errors.porteurTypeShort.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Dénomination</SectionTitle>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="porteurShort">
                        Sigle *
                      </label>
                      <input
                        className={inputClass}
                        id="porteurShort"
                        maxLength={20}
                        type="text"
                        {...register("porteurShort")}
                      />
                      {errors.porteurShort && (
                        <p className={errorClass}>
                          {errors.porteurShort.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="porteurNameShort">
                        Nom court
                      </label>
                      <input
                        className={inputClass}
                        id="porteurNameShort"
                        type="text"
                        {...register("porteurNameShort")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="porteurName">
                      Nom complet *
                    </label>
                    <input
                      className={inputClass}
                      id="porteurName"
                      maxLength={300}
                      type="text"
                      {...register("porteurName")}
                    />
                    {errors.porteurName && (
                      <p className={errorClass}>{errors.porteurName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="porteurDesc">
                      Description
                    </label>
                    <textarea
                      className={inputClass}
                      id="porteurDesc"
                      rows={3}
                      {...register("porteurDesc")}
                    />
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations complémentaires</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="porteurDirecteur">
                      Directeur
                    </label>
                    <input
                      className={inputClass}
                      id="porteurDirecteur"
                      type="text"
                      {...register("porteurDirecteur")}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="porteurPicto">
                      Picto (code)
                    </label>
                    <input
                      className={inputClass}
                      id="porteurPicto"
                      type="text"
                      {...register("porteurPicto")}
                    />
                  </div>
                </div>
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

export default PageAdminPorteurEdition;
