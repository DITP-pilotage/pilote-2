import { Controller, useFormContext } from "react-hook-form";
import { MultiSelect } from "@/components/_commons/MultiSelect/MultiSelect";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

export const MultiSelectPorteursDAC = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursDAC.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="porteurIdsDAC"
      render={({ field }) => (
        <MultiSelect
          label="Porteurs DAC"
          suffixeLibellé="porteur(s) DAC"
          optionsGroupées={[
            {
              label: "",
              options: porteurs.map((p) => ({ value: p.id, label: p.label })),
            },
          ]}
          valeursSélectionnéesParDéfaut={field.value}
          changementValeursSélectionnéesCallback={field.onChange}
        />
      )}
    />
  );
};
