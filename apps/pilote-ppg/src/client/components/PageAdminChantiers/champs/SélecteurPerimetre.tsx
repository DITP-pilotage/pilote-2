import { Controller, useFormContext, useWatch } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPerimetre = () => {
  const form = useFormContext<ChantierForm>();
  const porteurIdPrincipal = useWatch({
    control: form.control,
    name: "porteurIdPrincipal",
  });
  const { data: perimetres } = api.metadataChantier.listerPerimetres.useQuery(
    { porteurId: porteurIdPrincipal },
    { enabled: !!porteurIdPrincipal },
  );

  return (
    <Controller
      control={form.control}
      name="chPer"
      render={({ field }) => (
        <Sélecteur
          htmlName="chPer"
          libellé="Périmètre *"
          estDesactive={!porteurIdPrincipal}
          texteFantôme={
            porteurIdPrincipal
              ? undefined
              : "Sélectionnez d'abord un porteur principal"
          }
          options={(perimetres ?? []).map((p) => ({
            libellé: `${p.id} — ${p.nom}`,
            valeur: p.id,
          }))}
          onChange={field.onChange}
          valeurSélectionnée={field.value}
          erreur={form.formState.errors.chPer}
        />
      )}
    />
  );
};

export default SélecteurPerimetre;
