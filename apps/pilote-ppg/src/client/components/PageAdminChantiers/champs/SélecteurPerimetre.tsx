import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPerimetre = () => {
  const { control, formState, setValue, getValues } =
    useFormContext<ChantierForm>();
  const porteurIdPrincipal = useWatch({ control, name: "porteurIdPrincipal" });
  const { data: perimetres, isSuccess } =
    api.metadataChantier.listerPerimetres.useQuery(
      { porteurId: porteurIdPrincipal },
      { enabled: !!porteurIdPrincipal },
    );

  useEffect(() => {
    if (!isSuccess) return;
    const chPerActuel = getValues("chPer");
    const chPerEstToujoursValide = perimetres.some(
      (perimetre) => perimetre.id === chPerActuel,
    );
    if (chPerActuel && !chPerEstToujoursValide) {
      setValue("chPer", "", { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porteurIdPrincipal, perimetres, isSuccess]);

  return (
    <Controller
      control={control}
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
          erreur={formState.errors.chPer}
        />
      )}
    />
  );
};

export default SélecteurPerimetre;
