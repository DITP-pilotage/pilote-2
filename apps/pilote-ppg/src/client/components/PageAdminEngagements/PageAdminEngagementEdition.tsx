import { useRouter } from "next/router";
import { FormProvider } from "react-hook-form";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataEngagement } from "@/server/metadataEngagement/queries/RecupererEngagementQuery";
import {
  defaultEngagementVide,
  EngagementForm,
  useEngagementForm,
} from "@/components/PageAdminEngagements/useEngagementForm";
import { Input } from "@/components/_commons/Input";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";

interface Props {
  engagementId: string;
  estUneCréation: boolean;
  engagementData: MetadataEngagement | null;
  idSuivant: string | null;
}

const PageAdminEngagementEdition = ({
  engagementId,
  estUneCréation,
  engagementData,
  idSuivant,
}: Props) => {
  const router = useRouter();
  const engagementIdEffectif = estUneCréation
    ? (idSuivant ?? engagementId)
    : engagementId;

  const defaultValues: EngagementForm = engagementData
    ? {
        engagementId: engagementData.engagementId,
        engagementShort: engagementData.engagementShort,
        engagementName: engagementData.engagementName,
        estUneCréation: false,
      }
    : defaultEngagementVide(engagementIdEffectif);

  const { reactHookForm, enregistrer, alerte, isPending } = useEngagementForm({
    defaultValues,
    engagementId: engagementIdEffectif,
    estUneCréation,
  });

  const archiverMutation = api.metadataEngagement.archiver.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels-deprecies/engagements/${engagementIdEffectif}?_action=modification-reussie`,
      ),
  });

  const restorerMutation = api.metadataEngagement.restorer.useMutation({
    onSuccess: () =>
      router.push(
        `/panel-administrateur/referentiels-deprecies/engagements/${engagementIdEffectif}?_action=modification-reussie`,
      ),
  });

  const estSupprime = engagementData?.deletedAt != null;

  const { data: utilisation } =
    api.metadataEngagement.verifierUtilisation.useQuery(
      { engagementShort: defaultValues.engagementShort },
      { enabled: !estUneCréation && !estSupprime },
    );
  const estUtilisé = utilisation?.estUtilise ?? false;

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouvel engagement - ${engagementIdEffectif}`
    : `Engagement ${engagementId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <FilAriane
          chemin={[
            {
              nom: "Engagements",
              lien: "/panel-administrateur/referentiels-deprecies/engagements",
            },
          ]}
          libelléPageCourante={titre}
        />

        {succès && (
          <Alerte
            classesSupplementaires="mb-6"
            message="Engagement enregistré avec succès."
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
            titre={`Cet engagement est associé à ${utilisation?.nombreChantiers} chantier(s) et ne peut pas être supprimé.`}
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
                  {estUneCréation ? "Nouvel engagement" : "Édition"}
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
                              engagementId: engagementIdEffectif,
                            })
                          : archiverMutation.mutate({
                              csrf: récupérerUnCookie("csrf") ?? "",
                              engagementId: engagementIdEffectif,
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
                      {engagementIdEffectif}
                    </p>
                  </div>
                  <Input<EngagementForm>
                    control={reactHookForm.control}
                    label="Code (engagement_short)"
                    name="engagementShort"
                    readOnly={!estUneCréation}
                    required
                  />
                </div>
              </section>

              <section className="px-6 py-8">
                <SectionTitle>Dénomination</SectionTitle>
                <Input<EngagementForm>
                  control={reactHookForm.control}
                  label="Nom"
                  name="engagementName"
                  required
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

export default PageAdminEngagementEdition;
