import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPerimetre = () => {
  const { data: perimetres = [] } =
    api.metadataChantier.listerPerimetres.useQuery();
  const { control, formState } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="chPer"
      render={({ field }) => (
        <Sélecteur
          htmlName="chPer"
          libellé="Périmètre *"
          options={perimetres.map((p) => ({
            libellé: `${p.id} — ${p.nom}`,
            valeur: p.id,
          }))}
          onChange={field.onChange}
          valeurSélectionnée={field.value}
          erreur={formState.errors.chPer}
        />
      )}
    />
  );
};

export default SélecteurPerimetre;
