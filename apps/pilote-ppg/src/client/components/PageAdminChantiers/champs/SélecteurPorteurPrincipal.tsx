import { Controller, useFormContext } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { SelectField } from "@/components/shared/SelectField";
import { api } from "@/server/framework/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPorteurPrincipal = () => {
  const { data: porteurs = [] } =
    api.parametrageChantier.listPorteursMinistere.useQuery();
  const form = useFormContext<ChantierForm>();

  return (
    <Controller
      control={form.control}
      name="porteurIdPrincipal"
      render={({ field }) => (
        <SelectField
          className={FIELD_GROUP_SPACING}
          name="porteurIdPrincipal"
          label="Porteur principal (ministère) *"
          placeholder="Sélectionnez un porteur"
          options={porteurs.map((p) => ({ libelle: p.label, valeur: p.id }))}
          onChange={(valeur) => {
            field.onChange(valeur);
            form.setValue("chPer", "");
          }}
          value={field.value}
          errorMessage={form.formState.errors.porteurIdPrincipal?.message?.toString()}
        />
      )}
    />
  );
};

export default SélecteurPorteurPrincipal;
