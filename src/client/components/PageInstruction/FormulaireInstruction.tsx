import { pageInstruction } from "./PageInstructionServerSideContext";

export function FormulaireInstruction() {
  const { rattachements } = pageInstruction.useServerSidePropsContext();

  const renderEvaluation = (
    label: string,
    evaluation: { id: string; note: number | null; commentaire: string },
  ) => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
        {label}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Note:</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
            {evaluation.note ?? "N/A"}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">Commentaire:</div>
          <p className="mt-1 text-sm text-gray-600">
            {evaluation.commentaire || "Aucun commentaire"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Instruction des objectifs et critères
        </h1>

        {rattachements.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">
              Aucune fiche d'instruction disponible.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {rattachements.map((rattachement) => (
              <div
                className="rounded-lg bg-white shadow-lg"
                key={rattachement.libelle}
              >
                <div className="border-b border-gray-200 bg-dsfr-blue-france-525 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white !mb-0">
                    {rattachement.libelle}
                  </h2>
                </div>

                <div className="p-6">
                  {/* Objectifs */}
                  <section className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Objectifs
                    </h3>
                    <div className="space-y-6">
                      {rattachement.objectifs.map((objectif) => (
                        <div
                          className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm"
                          key={objectif.id}
                        >
                          <div className="mb-4 flex justify-between items-center">
                            <h4 className="text-base font-semibold text-gray-900 !mb-0">
                              {objectif.libelle}
                            </h4>
                            {objectif.tutelle ? (
                              <span className="ml-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                                {objectif.tutelle.nom}
                              </span>
                            ) : null}
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {renderEvaluation(
                              "Auto-évaluation",
                              objectif.autoEvaluation,
                            )}
                            {renderEvaluation(
                              "Consolidation",
                              objectif.consolidation,
                            )}
                            {renderEvaluation(
                              "Instruction",
                              objectif.instruction,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Critères */}
                  <section>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Critères
                    </h3>
                    <div className="space-y-6">
                      {rattachement.criteres.map((critere) => (
                        <div
                          className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm"
                          key={critere.id}
                        >
                          <h4 className="mb-4 text-base font-semibold text-gray-900">
                            {critere.libelle}
                          </h4>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {renderEvaluation(
                              "Auto-évaluation",
                              critere.autoEvaluation,
                            )}
                            {renderEvaluation(
                              "Consolidation",
                              critere.consolidation,
                            )}
                            {renderEvaluation(
                              "Instruction",
                              critere.instruction,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
