import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPorteurPrincipal = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMinistere.useQuery();
  const { control, formState } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="porteurIdPrincipal"
      render={({ field }) => (
        <Sélecteur
          htmlName="porteurIdPrincipal"
          libellé="Porteur principal (ministère) *"
          options={porteurs.map((p) => ({ libellé: p.label, valeur: p.id }))}
          onChange={field.onChange}
          valeurSélectionnée={field.value}
          erreur={formState.errors.porteurIdPrincipal}
        />
      )}
    />
  );
};

export default SélecteurPorteurPrincipal;
