import { Controller, useFormContext } from "react-hook-form";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const MultiSelectPorteursSecondaires = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMIN.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="porteurIdsSecondaires"
      render={({ field }) => (
        <MultiSelect
          label="Porteurs secondaires (ministères)"
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

export default MultiSelectPorteursSecondaires;
