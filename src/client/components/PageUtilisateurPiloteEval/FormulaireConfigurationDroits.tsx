import { Controller } from "react-hook-form";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { useFormulaireConfigurationDroits } from "@/components/PageUtilisateurPiloteEval/useFormulaireConfigurationDroits";

export const FormulaireConfigurationDroits = () => {
  const {
    email,
    control,
    handleSubmit,
    onSubmit,
    rattachementsOptionsGroupees,
    criteresOptionsGroupees,
  } = useFormulaireConfigurationDroits();

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-dsfr-grey-50 mb-2">
          Configuration des droits
        </h1>
        <p className="text-sm font-semibold text-italic">{email}</p>
      </header>

      <div className="bg-white p-8 rounded-sm shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-8">
            <section>
              <h2 className="!text-xl">Auto-évaluation</h2>
              <Controller
                control={control}
                name="autoEvaluation.rattachementCodes"
                render={({ field }) => (
                  <MultiSelectFiltre
                    onChange={field.onChange}
                    optionGroups={rattachementsOptionsGroupees}
                    suffixLabel="territoire(s) sélectionné(s)"
                    values={field.value}
                  />
                )}
              />
            </section>

            <section>
              <h2 className="!text-xl">Consolidation</h2>
              <Controller
                control={control}
                name="consolidation.rattachementCodes"
                render={({ field }) => (
                  <MultiSelectFiltre
                    onChange={field.onChange}
                    optionGroups={rattachementsOptionsGroupees}
                    suffixLabel="territoire(s) sélectionné(s)"
                    values={field.value}
                  />
                )}
              />
            </section>

            <section>
              <h2 className="!text-xl">Instruction</h2>
              <div className="space-y-6">
                <Controller
                  control={control}
                  name="instructionObjectifs.rattachementCodes"
                  render={({ field }) => (
                    <MultiSelectFiltre
                      className="flex-col items-start"
                      label="Objectifs"
                      onChange={field.onChange}
                      optionGroups={rattachementsOptionsGroupees}
                      suffixLabel="territoire(s) sélectionné(s)"
                      values={field.value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="instructionManiereDeServir.critereCodes"
                  render={({ field }) => (
                    <MultiSelectFiltre
                      className="flex-col items-start"
                      label="Manière de servir"
                      onChange={field.onChange}
                      optionGroups={criteresOptionsGroupees}
                      suffixLabel="critère(s) sélectionné(s)"
                      values={field.value}
                    />
                  )}
                />
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button className="fr-btn" type="submit">
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
