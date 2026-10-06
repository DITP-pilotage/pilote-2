import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FIELD_GROUP_SPACING } from "@/components/shared/fieldGroupSpacing";
import { SelectField } from "@/components/shared/SelectField";
import { api } from "@/server/framework/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPerimetre = () => {
  const form = useFormContext<ChantierForm>();
  const porteurIdPrincipal = useWatch({
    control: form.control,
    name: "porteurIdPrincipal",
  });
  const { data: perimetres } = api.metadataChantier.listPerimetres.useQuery(
    { porteurId: porteurIdPrincipal },
    { enabled: !!porteurIdPrincipal },
  );

  return (
    <Controller
      control={form.control}
      name="chPer"
      render={({ field }) => (
        <SelectField
          className={FIELD_GROUP_SPACING}
          name="chPer"
          label="Périmètre *"
          disabled={!porteurIdPrincipal}
          placeholder={
            porteurIdPrincipal
              ? "Sélectionnez un périmètre"
              : "Sélectionnez d'abord un porteur principal"
          }
          options={(perimetres ?? []).map((p) => ({
            libelle: `${p.id} — ${p.nom}`,
            valeur: p.id,
          }))}
          onChange={field.onChange}
          value={field.value}
          errorMessage={form.formState.errors.chPer?.message?.toString()}
        />
      )}
    />
  );
};

export default SélecteurPerimetre;
