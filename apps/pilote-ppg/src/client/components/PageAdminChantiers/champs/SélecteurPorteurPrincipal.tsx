import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPorteurPrincipal = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMinistere.useQuery();
  const form = useFormContext<ChantierForm>();

  return (
    <Controller
      control={form.control}
      name="porteurIdPrincipal"
      render={({ field }) => (
        <Sélecteur
          htmlName="porteurIdPrincipal"
          libellé="Porteur principal (ministère) *"
          texteFantôme="Sélectionnez un porteur"
          options={porteurs.map((p) => ({ libellé: p.label, valeur: p.id }))}
          onChange={(valeur) => {
            field.onChange(valeur);
            form.setValue("chPer", "");
          }}
          valeurSélectionnée={field.value}
          erreur={form.formState.errors.porteurIdPrincipal}
        />
      )}
    />
  );
};

export default SélecteurPorteurPrincipal;
