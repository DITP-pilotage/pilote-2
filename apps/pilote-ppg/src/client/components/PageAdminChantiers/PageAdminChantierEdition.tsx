import { FormProvider } from "react-hook-form";
import { FunctionComponent } from "react";
import Link from "next/link";
import Alerte from "@/components/_commons/Alerte/Alerte";
import api from "@/server/infrastructure/api/trpc/api";
import FicheChantier from "@/components/PageAdminChantiers/FicheChantier";
import {
  useChantierMutations,
  defaultChantierVide,
} from "@/components/PageAdminChantiers/useChantierMutations";

interface PageAdminChantierEditionProps {
  chantierId: string;
  estUneCréation: boolean;
  modificationReussie: boolean;
  creationReussie: boolean;
}

const PageAdminChantierEdition: FunctionComponent<
  PageAdminChantierEditionProps
> = ({ chantierId, estUneCréation, modificationReussie, creationReussie }) => {
  const { data: chantierData, isLoading: isLoadingChantier } =
    api.metadataChantier.récupérer.useQuery(
      { chantierId },
      { enabled: !estUneCréation },
    );

  const { data: idSuivant, isLoading: isLoadingIdSuivant } =
    api.metadataChantier.récupérerIdSuivant.useQuery(undefined, {
      enabled: estUneCréation,
    });

  const isLoading = estUneCréation ? isLoadingIdSuivant : isLoadingChantier;

  if (isLoading) return null;

  const chantierIdEffectif = estUneCréation
    ? (idSuivant ?? chantierId)
    : chantierId;

  const defaultValues = chantierData
    ? { ...chantierData, conseillerMail: chantierData.conseillerMail ?? "" }
    : defaultChantierVide(chantierIdEffectif);

  return (
    <ChantierEditionForm
      chantierId={chantierIdEffectif}
      defaultValues={defaultValues}
      estUneCréation={estUneCréation}
      modificationReussie={modificationReussie}
      creationReussie={creationReussie}
    />
  );
};

interface ChantierEditionFormProps {
  chantierId: string;
  defaultValues: ReturnType<typeof defaultChantierVide>;
  estUneCréation: boolean;
  modificationReussie: boolean;
  creationReussie: boolean;
}

const ChantierEditionForm: FunctionComponent<ChantierEditionFormProps> = ({
  chantierId,
  defaultValues,
  estUneCréation,
  modificationReussie,
  creationReussie,
}) => {
  const { reactHookForm, modifierChantier, creerChantier, alerte } =
    useChantierMutations({ defaultValues, chantierId });

  const titre = estUneCréation
    ? `Nouveau chantier — ${chantierId}`
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

      {alerte && (
        <div className="mb-4">
          <Alerte titre={alerte.titre} type={alerte.type} />
        </div>
      )}

      {modificationReussie && !alerte && (
        <div className="mb-4">
          <Alerte
            message="Les modifications ont bien été prises en compte."
            titre="Chantier modifié avec succès !"
            type="succès"
          />
        </div>
      )}

      {creationReussie && !alerte && (
        <div className="mb-4">
          <Alerte
            message="Le chantier a bien été créé."
            titre="Chantier créé avec succès !"
            type="succès"
          />
        </div>
      )}

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
