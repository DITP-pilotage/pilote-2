import { Controller, ControllerRenderProps } from "react-hook-form";
import { useFormSaisieInformationUtilisateur } from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/form";
import { UtilisateurFormInputs } from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";
import { ApplicationAccessible } from "@/server/domain/utilisateur/Utilisateur.interface";

const applications = [
  {
    id: "pilote",
    label: "Pilote",
    value: ApplicationAccessible.PILOTE as const,
  },
  {
    id: "pilote-eval",
    label: "Pilote eval",
    value: ApplicationAccessible.PILOTE_EVAL as const,
  },
] as const;

export const SelecteurApplication = () => {
  const { control } = useFormSaisieInformationUtilisateur();

  const handleCheckboxChange = (
    field: ControllerRenderProps<
      UtilisateurFormInputs,
      "applicationsAccessibles"
    >,
    checked: boolean,
    value: (typeof applications)[number]["value"],
  ) => {
    const newValue = checked
      ? [...field.value, value]
      : field.value.filter((fieldValue) => fieldValue !== value);
    field.onChange(newValue);
  };

  return (
    <Controller
      control={control}
      name="applicationsAccessibles"
      render={({ field }) => {
        return (
          <div className="flex gap-3">
            {applications.map((app) => (
              <label
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dsfr-border-default-grey cursor-pointer transition-all hover:border-dsfr-primary hover:bg-blue-50 has-[:checked]:border-dsfr-primary has-[:checked]:bg-blue-50 has-[:checked]:shadow-sm"
                htmlFor={app.id}
                key={app.id}
              >
                <input
                  checked={field.value.includes(app.value)}
                  className="w-5 h-5 accent-dsfr-primary cursor-pointer"
                  id={app.id}
                  onChange={(e) =>
                    handleCheckboxChange(field, e.target.checked, app.value)
                  }
                  type="checkbox"
                />
                <span className="text-sm font-medium text-dsfr-text-title-grey">
                  {app.label}
                </span>
              </label>
            ))}
          </div>
        );
      }}
    />
  );
};
