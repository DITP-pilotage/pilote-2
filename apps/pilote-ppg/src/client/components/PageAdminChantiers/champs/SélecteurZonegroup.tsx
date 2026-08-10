import { FunctionComponent } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierMutations";

const SélecteurZonegroup: FunctionComponent = () => {
  const { data: zonegroups = [] } =
    api.metadataChantier.listerZonegroups.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="zgApplicable"
      render={({ field }) => (
        <Sélecteur
          htmlName="zgApplicable"
          libellé="Zone group"
          options={[
            { libellé: "— Aucune —", valeur: "" },
            ...zonegroups.map((z) => ({
              libellé: `${z.id} — ${z.nom}`,
              valeur: z.id,
            })),
          ]}
          onChange={(val) => field.onChange(val || null)}
          valeurSélectionnée={field.value ?? ""}
        />
      )}
    />
  );
};

export default SélecteurZonegroup;
