import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { FunctionComponent } from "react";
import CompteurCaractères from "@/components/_commons/CompteurCaractères/CompteurCaractères";
import Titre from "@/components/_commons/Titre/Titre";
import {
  LIMITE_CARACTÈRES_COMMENTAIRE,
  validationCommentaireFormulaire,
} from "@/validation/commentaire";
import { Icone } from "@/components/_commons/Icone";
import { SuccessIcon } from "@/components/_commons/Icones/SuccessIcon";
import { ArrowGoBack1Icon } from "@/components/_commons/Icones/ArrowGoBack1Icon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { Publication } from "@/components/PageChantier/Publication/Publication.interface";

interface CommentaireFormulaireProps {
  publication: Publication | null;
  libelle: string;
  consigne: string;
  annulationCallback?: () => void;
  onModifier: SubmitHandler<{ contenu: string }>;
}

const CommentaireFormulaire: FunctionComponent<CommentaireFormulaireProps> = ({
  publication,
  libelle,
  consigne,
  annulationCallback,
  onModifier,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<{ contenu: string }>({
    mode: "all",
    resolver: zodResolver(validationCommentaireFormulaire),
    defaultValues: { contenu: publication?.contenu ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onModifier)}>
      <div className="flex items-center gap-2 fr-mb-1v">
        <Titre baliseHtml="h3" className="text-xl mb-0">
          {`Modifier le commentaire "${libelle}"`}
        </Titre>
        <Infobulle classNameIcone="w-5 h-5">{consigne}</Infobulle>
      </div>
      <p className="fr-text--xs mb-4 text-dsfr-mention-grey">
        {`Vous pouvez apporter ci-dessous des modifications au commentaire que vous avez posté le ${PiloteDateFormatter.isoDateFranceMetropolitaine(publication!.dateModification)}. Après validation, le commentaire modifié annulera et remplacera le commentaire actuel.`}
      </p>
      <div
        className={`flex flex-col fr-mb-0 fr-input-group ${errors.contenu ? "fr-input-group--error" : ""}`}
      >
        <textarea
          className="fr-input fr-text--sm fr-mb-0"
          rows={6}
          {...register("contenu")}
        />
        <div className="flex justify-between">
          <div>
            {!!errors.contenu && (
              <p className="fr-error-text fr-mt-0 fr-mr-2w">
                {errors.contenu.message}
              </p>
            )}
          </div>
          <CompteurCaractères
            compte={watch("contenu")?.length ?? 0}
            limiteDeCaractères={LIMITE_CARACTÈRES_COMMENTAIRE}
          />
        </div>
      </div>
      <div className="flex justify-end fr-mt-2w">
        <Bouton
          className="mr-3"
          disabled={!isValid}
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
  );
};

export default CommentaireFormulaire;
