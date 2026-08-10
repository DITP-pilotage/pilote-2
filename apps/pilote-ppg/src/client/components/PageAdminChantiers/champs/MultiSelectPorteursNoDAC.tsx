import { FunctionComponent } from "react";
import { Controller, useFormContext } from "react-hook-form";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierMutations";

const MultiSelectPorteursNoDAC: FunctionComponent = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMIN.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="porteurIdsNoDAC"
      render={({ field }) => (
        <MultiSelect
          label="Porteurs non-DAC (ministères)"
          suffixeLibellé="ministère(s)"
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

export default MultiSelectPorteursNoDAC;
