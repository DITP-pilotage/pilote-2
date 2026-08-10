import { FormProvider } from "react-hook-form";
import Link from "next/link";
import AlerteConditionnelle from "@/components/_commons/Alerte/AlerteConditionnelle";
import FicheChantier from "@/components/PageAdminChantiers/FicheChantier";
import { MetadataChantier } from "@/server/metadataChantier/queries/RecupererChantierQuery";
import {
  useChantierForm,
  defaultChantierVide,
  ChantierForm,
} from "@/components/PageAdminChantiers/useChantierForm";

interface PageAdminChantierEditionProps {
  chantierId: string;
  estUneCréation: boolean;
  chantierData: MetadataChantier | null;
  idSuivant: string | null;
  modificationReussie: boolean;
  creationReussie: boolean;
}

const PageAdminChantierEdition = ({
  chantierId,
  estUneCréation,
  chantierData,
  idSuivant,
  modificationReussie,
  creationReussie,
}: PageAdminChantierEditionProps) => {
  const chantierIdEffectif = estUneCréation
    ? (idSuivant ?? chantierId)
    : chantierId;

  const defaultValues: ChantierForm = chantierData
    ? { ...chantierData, conseillerMail: chantierData.conseillerMail ?? "" }
    : defaultChantierVide(chantierIdEffectif);

  const { reactHookForm, modifierChantier, creerChantier, alerte } =
    useChantierForm({ defaultValues, chantierId: chantierIdEffectif });

  const titre = estUneCréation
    ? `Nouveau chantier — ${chantierIdEffectif}`
    : `Chantier ${chantierId}`;

  return (
    <div className="p-6">
      <nav className="mb-4">
        <Link
          className="text-sm text-blue-600 hover:underline"
          href="/panel-administrateur/chantiers"
        >
          ← Gestion des chantiers
        </Link>
      </nav>

      <AlerteConditionnelle
        show={!!alerte}
        titre={alerte?.titre}
        type={alerte?.type ?? "erreur"}
      />
      <AlerteConditionnelle
        show={modificationReussie && !alerte}
        message="Les modifications ont bien été prises en compte."
        titre="Chantier modifié avec succès !"
        type="succès"
      />
      <AlerteConditionnelle
        show={creationReussie && !alerte}
        message="Le chantier a bien été créé."
        titre="Chantier créé avec succès !"
        type="succès"
      />

      <FormProvider {...reactHookForm}>
        <form
          method="post"
          onSubmit={reactHookForm.handleSubmit(
            estUneCréation ? creerChantier : modifierChantier,
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{titre}</h1>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              type="submit"
            >
              {estUneCréation ? "Créer le chantier" : "Sauvegarder"}
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <FicheChantier />
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              type="submit"
            >
              {estUneCréation ? "Créer le chantier" : "Sauvegarder"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default PageAdminChantierEdition;
