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
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SectionTitle } from "@/components/_commons/SectionTitle";
import Alerte from "@/components/_commons/Alerte/Alerte";
import type { SélecteurOption } from "@/client/components/_commons/Sélecteur/Sélecteur.interface";
import type { PorteurTypeShort } from "@/server/metadataPorteur/handlers/EnregistrerPorteurHandler";

interface Props {
  porteurId: string;
  estUneCréation: boolean;
  porteurData: MetadataPorteur | null;
  idSuivant: string | null;
}

const OPTIONS_TYPE: SélecteurOption<PorteurTypeShort>[] = [
  { libellé: "Ministère (MIN)", valeur: "MIN" },
  { libellé: "DAC", valeur: "DAC" },
  { libellé: "Autre", valeur: "AUTRE" },
];

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
          (porteurData.porteurTypeShort as PorteurTypeShort) ?? "MIN",
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

  const succès = router.query._action === "modification-reussie";
  const titre = estUneCréation
    ? `Nouveau porteur — ${porteurIdEffectif}`
    : `Porteur ${porteurId}`;

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            className="text-primary hover:text-dsfr-blue-france-sun-113-hover font-medium hover:underline underline-offset-2 transition-colors"
            href="/panel-administrateur/referentiels/porteurs"
          >
            Porteurs
          </Link>
          <span className="text-dsfr-grey-625">/</span>
          <span className="text-dsfr-grey-625">{titre}</span>
        </nav>

        {succès && (
          <Alerte
            classesSupplementaires="mb-6"
            message="Porteur enregistré avec succès."
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
                  {estUneCréation ? "Nouveau porteur" : "Édition"}
                </p>
                <h1 className="text-3xl font-bold text-dsfr-grey-200">
                  {titre}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {!estUneCréation && (
                  <Bouton
                    className={
                      estSupprimé
                        ? "bg-pilote-vert text-white hover:bg-success"
                        : "bg-dsfr-warning-950 text-error border border-dsfr-warning-925 hover:bg-dsfr-warning-925"
                    }
                    label={estSupprimé ? "Restaurer" : "Supprimer"}
                    onClick={() =>
                      suppressionMutation.mutate({
                        csrf: récupérerUnCookie("csrf") ?? "",
                        porteurId: porteurIdEffectif,
                        restaurer: estSupprimé,
                      })
                    }
                    variant="primary"
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

            <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-900 overflow-hidden divide-y divide-dsfr-grey-925">
              <section className="px-6 py-8">
                <SectionTitle>Identification</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-dsfr-grey-625 mb-1">
                      ID
                    </span>
                    <p className="px-3 py-2 text-sm font-mono text-dsfr-grey-625 bg-dsfr-grey-1000 border border-dsfr-grey-925 rounded-sm">
                      {porteurIdEffectif}
                    </p>
                  </div>
                  <Controller
                    control={reactHookForm.control}
                    name="porteurTypeShort"
                    render={({ field }) => (
                      <Sélecteur
                        htmlName="porteurTypeShort"
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
                  <div className="grid grid-cols-2 gap-4">
                    <Input<PorteurForm>
                      control={reactHookForm.control}
                      label="Sigle"
                      name="porteurShort"
                      required
                    />
                    <Input<PorteurForm>
                      control={reactHookForm.control}
                      label="Nom court"
                      name="porteurNameShort"
                    />
                  </div>
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
