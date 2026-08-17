import { useRouter } from "next/router";
import Link from "next/link";
import { Controller, FormProvider } from "react-hook-form";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataPerimetre } from "@/server/metadataPerimetre/queries/RecupererPerimetreQuery";
import {
  defaultPerimetreVide,
  PerimetreForm,
  usePerimetreForm,
} from "@/components/PageAdminPerimetres/usePerimetreForm";

interface Props {
  perimetreId: string;
  estUneCréation: boolean;
  perimetreData: MetadataPerimetre | null;
  idSuivant: string | null;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-semibold text-[#1e1e1e] uppercase tracking-wide border-l-[3px] border-[#000091] pl-3 mb-5">
    {children}
  </h2>
);

const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-[#000091]";
const errorClass = "mt-1 text-xs text-red-600";

const PageAdminPerimetreEdition = ({
  perimetreId,
  estUneCréation,
  perimetreData,
  idSuivant,
}: Props) => {
  const router = useRouter();
  const perimetreIdEffectif = estUneCréation ? (idSuivant ?? perimetreId) : perimetreId;

  const defaultValues: PerimetreForm = perimetreData
    ? {
        perimetreId: perimetreData.perimetreId,
        perNom: perimetreData.perNom,
        perPorteurId: perimetreData.perPorteurId,
      }
    : defaultPerimetreVide(perimetreIdEffectif);

  const { reactHookForm, enregistrer, alerte, isPending } = usePerimetreForm({
    defaultValues,
    perimetreId: perimetreIdEffectif,
    estUneCréation,
  });

  const suppressionMutation = api.metadataPerimetre.supprimer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels/perimetres/${perimetreIdEffectif}?_action=modification-reussie`,
      ),
  });

  const estSupprimé =
    perimetreData?.deletedAt !== null && perimetreData?.deletedAt !== undefined;

  const { data: porteurs = [] } = api.metadataPorteur.lister.useQuery();
  const porteursActifs = porteurs.filter((p) => p.deletedAt === null);

  const {
    register,
    control,
    formState: { errors },
  } = reactHookForm;

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau périmètre — ${perimetreIdEffectif}`
    : `Périmètre ${perimetreId}`;

  return (
    <div className="min-h-screen bg-[#f5f5fe]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-[#000091] hover:text-[#1212ff] font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/referentiels/perimetres"
          >
            Périmètres
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{titre}</span>
        </nav>

        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Périmètre enregistré avec succès.
          </div>
        )}
        {alerte && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm font-medium">
            {alerte.titre}
          </div>
        )}

        <FormProvider {...reactHookForm}>
          <form method="post" onSubmit={reactHookForm.handleSubmit(enregistrer)}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-[#000091] uppercase tracking-widest mb-1">
                  {estUneCréation ? "Nouveau périmètre" : "Édition"}
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
                        perimetreId: perimetreIdEffectif,
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
                      {perimetreIdEffectif}
                    </p>
                  </div>
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Informations</SectionTitle>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass} htmlFor="perNom">
                      Nom *
                    </label>
                    <input
                      className={inputClass}
                      id="perNom"
                      maxLength={300}
                      type="text"
                      {...register("perNom")}
                    />
                    {errors.perNom && (
                      <p className={errorClass}>{errors.perNom.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="perPorteurId">
                      Porteur
                    </label>
                    <Controller
                      control={control}
                      name="perPorteurId"
                      render={({ field }) => (
                        <select
                          className={inputClass}
                          id="perPorteurId"
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          value={field.value ?? ""}
                        >
                          <option value="">— Aucun —</option>
                          {porteursActifs.map((porteur) => (
                            <option key={porteur.porteurId} value={porteur.porteurId}>
                              {porteur.porteurShort} — {porteur.porteurName}
                            </option>
                          ))}
                        </select>
                      )}
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

export default PageAdminPerimetreEdition;
