import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import Titre from "@/components/_commons/Titre/Titre";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Infobulle } from "@/components/shared/Infobulle";
import {
  FormulairePublicationConfiguration,
  Publication,
  ValeursPublication,
} from "@/components/PageChantier/Publication/Publication.interface";
import { ChampsFormulairePublication } from "@/components/PageChantier/Publication/ChampsFormulairePublication";

interface FormulairePublicationProps<T extends ValeursPublication> {
  publication: Publication | null;
  libelle: string;
  consigne: string;
  formulaire: FormulairePublicationConfiguration<T>;
  annulationCallback?: () => void;
  onModifier: SubmitHandler<T>;
}

export const FormulairePublication = <T extends ValeursPublication>({
  publication,
  libelle,
  consigne,
  formulaire,
  annulationCallback,
  onModifier,
}: FormulairePublicationProps<T>) => {
  const form = useForm<T>({
    mode: "all",
    resolver: formulaire.resolver,
    defaultValues: formulaire.valeursModification,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onModifier)}>
        <div className="flex items-center gap-2 fr-mb-1v">
          <Titre baliseHtml="h3" className="text-xl mb-0">
            {`Modifier le commentaire "${libelle}"`}
          </Titre>
          <Infobulle classNameIcone="w-5 h-5">{consigne}</Infobulle>
        </div>
        {publication ? (
          <p className="fr-text--xs mb-4 text-dsfr-mention-grey">
            {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${PiloteDateFormatter.isoDateFranceMetropolitaine(publication.dateModification)}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
          </p>
        ) : null}
        <ChampsFormulairePublication
          champsAnnexes={formulaire.champsAnnexes}
          limiteCaracteres={formulaire.limiteCaracteres}
        />
        <div className="flex justify-end fr-mt-2w">
          <Bouton
            className="mr-3"
            disabled={!form.formState.isValid}
            iconLeft={
              <Icone className="w-4 h-4 text-current" icone={SuccessIcon} />
            }
            label="Valider"
            type="submit"
            variant="primary"
          />
          <Bouton
            iconLeft={<Icone className="w-4 h-4" icone={ArrowGoBack1Icon} />}
            label="Annuler"
            onClick={annulationCallback}
            variant="secondary"
          />
        </div>
      </form>
    </FormProvider>
  );
};
