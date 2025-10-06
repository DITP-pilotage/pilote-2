import { useFieldArray } from "react-hook-form";
import { useFormSaisieInformationUtilisateur } from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/form";

export const SelecteurApplication = () => {
  const form = useFormSaisieInformationUtilisateur();
  const { fields } = useFieldArray({
    control: form.control,
    name: "applicationAccessible",
  });

  console.log(fields);

  return (
    <div className="flex gap-3">
      <label
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dsfr-border-default-grey cursor-pointer transition-all hover:border-dsfr-primary hover:bg-blue-50 has-[:checked]:border-dsfr-primary has-[:checked]:bg-blue-50 has-[:checked]:shadow-sm"
        htmlFor="pilote"
      >
        <input
          className="w-5 h-5 accent-dsfr-primary cursor-pointer"
          id="pilote"
          type="checkbox"
          value="Pilote"
        />
        <span className="text-sm font-medium text-dsfr-text-title-grey">
          Pilote
        </span>
      </label>
      <label
        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dsfr-border-default-grey cursor-pointer transition-all hover:border-dsfr-primary hover:bg-blue-50 has-[:checked]:border-dsfr-primary has-[:checked]:bg-blue-50 has-[:checked]:shadow-sm"
        htmlFor="pilote-eval"
      >
        <input
          className="w-5 h-5 accent-dsfr-primary cursor-pointer"
          id="pilote-eval"
          type="checkbox"
          value="Pilote eval"
        />
        <span className="text-sm font-medium text-dsfr-text-title-grey">
          Pilote eval
        </span>
      </label>
    </div>
  );
};
