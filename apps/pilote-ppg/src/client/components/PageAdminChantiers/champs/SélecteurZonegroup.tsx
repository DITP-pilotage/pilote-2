import { Controller, useFormContext } from "react-hook-form";
import { SelectField } from "@/components/shared/SelectField";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurZonegroup = () => {
  const { data: zonegroups = [] } =
    api.metadataChantier.listerZonegroups.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="zgApplicable"
      render={({ field }) => (
        <SelectField
          name="zgApplicable"
          label="Zone group"
          options={[
            { libelle: "— Aucune —", valeur: "" },
            ...zonegroups.map((z) => ({
              libelle: `${z.id} — ${z.nom}`,
              valeur: z.id,
            })),
          ]}
          onChange={(val) => field.onChange(val || null)}
          value={field.value ?? ""}
        />
      )}
    />
  );
};

export default SélecteurZonegroup;
