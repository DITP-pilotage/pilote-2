import { Controller, useFormContext } from "react-hook-form";
import Sélecteur from "@/components/_commons/Sélecteur/Sélecteur";
import api from "@/server/infrastructure/api/trpc/api";
import { ChantierForm } from "@/components/PageAdminChantiers/useChantierForm";

const SélecteurPorteurPrincipal = () => {
  const { data: porteurs = [] } =
    api.metadataChantier.listerPorteursMinistere.useQuery();
  const form = useFormContext<ChantierForm>();
  const utils = api.useUtils();

  const invaliderPerimetreSiBesoin = async (porteurId: string) => {
    const chPerActuel = form.getValues("chPer");
    if (!chPerActuel) return;
    const perimetres = await utils.metadataChantier.listerPerimetres.fetch({
      porteurId,
    });
    const chPerEstToujoursValide = perimetres.some(
      (perimetre) => perimetre.id === chPerActuel,
    );
    if (!chPerEstToujoursValide) {
      form.setValue("chPer", "", { shouldValidate: true });
    }
  };

  return (
    <Controller
      control={form.control}
      name="porteurIdPrincipal"
      render={({ field }) => (
        <Sélecteur
          htmlName="porteurIdPrincipal"
          libellé="Porteur principal (ministère) *"
          options={porteurs.map((p) => ({ libellé: p.label, valeur: p.id }))}
          onChange={(valeur) => {
            field.onChange(valeur);
            void invaliderPerimetreSiBesoin(valeur);
          }}
          valeurSélectionnée={field.value}
          erreur={form.formState.errors.porteurIdPrincipal}
        />
      )}
    />
  );
};

export default SélecteurPorteurPrincipal;
