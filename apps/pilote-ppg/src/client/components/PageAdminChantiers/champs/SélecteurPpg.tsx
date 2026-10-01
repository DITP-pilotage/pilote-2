import { Controller, useFormContext } from "react-hook-form";
import { SelectField } from "@/components/shared/SelectField";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPpg = () => {
  const { data: ppgs = [] } = api.metadataChantier.listerPpgs.useQuery();
  const { control, formState } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="chPpg"
      render={({ field }) => (
        <SelectField
          name="chPpg"
          label="PPG *"
          placeholder="Sélectionnez un PPG"
          options={ppgs.map((p) => ({
            libelle: `${p.id} — ${p.nom}`,
            valeur: p.id,
          }))}
          onChange={field.onChange}
          value={field.value}
          errorMessage={formState.errors.chPpg?.message?.toString()}
        />
      )}
    />
  );
};

export default SélecteurPpg;
