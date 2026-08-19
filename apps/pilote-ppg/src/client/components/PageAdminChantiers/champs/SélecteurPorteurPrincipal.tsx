import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPorteurPrincipal = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMinistere.useQuery();
  const { control } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="porteurIdPrincipal"
      render={({ field }) => (
        <Sélecteur
          htmlName="porteurIdPrincipal"
          libellé="Porteur principal (ministère)"
          texteFantôme="— Aucun —"
          options={porteurs.map((p) => ({ libellé: p.label, valeur: p.id }))}
          onChange={(val) => field.onChange(val || null)}
          valeurSélectionnée={field.value ?? ""}
        />
      )}
    />
  );
};

export default SélecteurPorteurPrincipal;
