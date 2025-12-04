import { Controller } from "react-hook-form";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";
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
        <h1 className="!text-3xl font-bold mb-4">
          Configuration des droits - Utilisateur
        </h1>
        <p className="font-bold text-italic">{email}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <section className="bg-white p-6 rounded shadow-sm !mb-4">
            <h2 className="!text-xl font-semibold mb-6">Auto-évaluation</h2>
            <Controller
              control={control}
              name="autoEvaluation.rattachementCodes"
              render={({ field }) => (
                <MultiSelect
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={field.onChange}
                  label=""
                  optionsGroupées={rattachementsOptionsGroupees}
                  suffixeLibellé="territoire(s) sélectionné(s)"
                  valeursSélectionnéesParDéfaut={field.value}
                />
              )}
            />
          </section>

          <section className="bg-white p-6 rounded shadow-sm">
            <h2 className="!text-xl font-semibold !mb-4">Consolidation</h2>
            <Controller
              control={control}
              name="consolidation.rattachementCodes"
              render={({ field }) => (
                <MultiSelect
                  afficherBoutonsSélection
                  changementValeursSélectionnéesCallback={field.onChange}
                  label=""
                  optionsGroupées={rattachementsOptionsGroupees}
                  suffixeLibellé="territoire(s) sélectionné(s)"
                  valeursSélectionnéesParDéfaut={field.value}
                />
              )}
            />
          </section>

          <section className="bg-white p-6 rounded shadow-sm !mb-4">
            <h2 className="!text-xl font-semibold mb-6">Instruction</h2>
            <div className="space-y-6">
              <Controller
                control={control}
                name="instructionObjectifs.rattachementCodes"
                render={({ field }) => (
                  <MultiSelect
                    afficherBoutonsSélection
                    changementValeursSélectionnéesCallback={field.onChange}
                    label="Objectifs"
                    optionsGroupées={rattachementsOptionsGroupees}
                    suffixeLibellé="territoire(s) sélectionné(s)"
                    valeursSélectionnéesParDéfaut={field.value}
                  />
                )}
              />

              <Controller
                control={control}
                name="instructionManiereDeServir.critereCodes"
                render={({ field }) => (
                  <MultiSelect
                    afficherBoutonsSélection
                    changementValeursSélectionnéesCallback={field.onChange}
                    label="Manière de servir"
                    optionsGroupées={criteresOptionsGroupees}
                    suffixeLibellé="critère(s) sélectionné(s)"
                    valeursSélectionnéesParDéfaut={field.value}
                  />
                )}
              />
            </div>
          </section>

          <div className="flex justify-end mt-6">
            <button className="fr-btn" type="submit">
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </>
  );
};
