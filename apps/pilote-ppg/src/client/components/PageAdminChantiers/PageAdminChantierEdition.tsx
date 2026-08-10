import { FormProvider } from "react-hook-form";
import { FunctionComponent } from "react";
import Link from "next/link";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { usePageChantier } from "./usePageChantier";
import FicheChantier from "./FicheChantier";

interface PageAdminChantierEditionProps {
  chantierId: string;
  estUneCréation: boolean;
  modificationReussie: boolean;
  creationReussie: boolean;
}

const PageAdminChantierEdition: FunctionComponent<
  PageAdminChantierEditionProps
> = ({ chantierId, estUneCréation, modificationReussie, creationReussie }) => {
  const {
    reactHookForm,
    modifierChantier,
    creerChantier,
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    alerte,
    reinitialiser,
    options,
    isLoading,
    chantierId: chantierIdEffectif,
  } = usePageChantier({ chantierId, estUneCréation });

  const titre = estUneCréation
    ? `Nouveau chantier — ${chantierIdEffectif}`
    : `Chantier ${chantierIdEffectif}`;

  if (isLoading) return null;

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
            <div className="flex gap-2">
              {estUneCréation ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  type="submit"
                >
                  Créer le chantier
                </button>
              ) : estEnCoursDeModification ? (
                <>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    type="submit"
                  >
                    Confirmer les changements
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm font-medium"
                    onClick={reinitialiser}
                    type="button"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  onClick={() => setEstEnCoursDeModification(true)}
                  type="button"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <FicheChantier
              chantierId={chantierIdEffectif}
              estEnCoursDeModification={
                estUneCréation || estEnCoursDeModification
              }
              options={options!}
            />
          </div>

          {(estUneCréation || estEnCoursDeModification) && (
            <div className="flex gap-2 mt-4">
              {estUneCréation ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  type="submit"
                >
                  Créer le chantier
                </button>
              ) : (
                <>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    type="submit"
                  >
                    Confirmer les changements
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm font-medium"
                    onClick={reinitialiser}
                    type="button"
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  );
};

export default PageAdminChantierEdition;
