import { Controller, useFormContext } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { SelectField } from "@/components/shared/SelectField";
import { api } from "@/server/framework/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurZonegroup = () => {
  const { data: zonegroups = [] } =
    api.parametrageChantier.listZonegroups.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="zgApplicable"
      render={({ field }) => (
        <SelectField
          className={FIELD_GROUP_SPACING}
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
