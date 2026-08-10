import { FunctionComponent } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierMutations";

const SélecteurPpg: FunctionComponent = () => {
  const { data: ppgs = [] } = api.metadataChantier.listerPpgs.useQuery();
  const { control, formState } = useFormContext<ChantierForm>();

  return (
    <Controller
      control={control}
      name="chPpg"
      render={({ field }) => (
        <Sélecteur
          htmlName="chPpg"
          libellé="PPG *"
          options={ppgs.map((p) => ({
            libellé: `${p.id} — ${p.nom}`,
            valeur: p.id,
          }))}
          onChange={field.onChange}
          valeurSélectionnée={field.value}
          erreur={formState.errors.chPpg}
        />
      )}
    />
  );
};

export default SélecteurPpg;
