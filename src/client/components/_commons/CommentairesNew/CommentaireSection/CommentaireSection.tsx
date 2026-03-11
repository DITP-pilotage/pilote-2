import { FunctionComponent, useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import { formaterDate } from "@/client/utils/date/date";
import { libellésTypesCommentaire } from "@/client/constants/libellésCommentaire";
import AlerteCommentaire, {
  CommentaireAction,
} from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import HistoriqueCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Historique/Historique";
import CommentaireFormulaire from "@/components/_commons/CommentairesNew/CommentaireSection/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";

interface CommentaireSectionProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  commentaireBrouillon: CommentaireV2 | null;
  réformeId: string;
  territoireCode: string;
  maille: Maille;
  modeEcriture?: boolean;
}

const CommentaireSection: FunctionComponent<CommentaireSectionProps> = ({
  type,
  commentaire,
  commentaireBrouillon,
  réformeId,
  territoireCode,
  maille,
  modeEcriture = false,
}) => {
  const [modeÉdition, setModeÉdition] = useQueryState(
    `edition-${type}`,
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const [action, setAction] = useState<CommentaireAction | null>(null);

  return (
    <div className="px-2 py-4">
      <p className="font-bold text-xl mb-1">{libellésTypesCommentaire[type]}</p>
      {commentaireBrouillon?.dateModification ? (
        <div className="my-2">
          <BandeauInformation bandeauType="INFO">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${formaterDate(commentaireBrouillon.dateModification, "DD/MM/YYYY")}`}
          </BandeauInformation>
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <CommentaireFormulaire
          annulationCallback={() => setModeÉdition(false)}
          commentaire={commentaire}
          maille={maille}
          onSuccess={(commentaireAction) => {
            setModeÉdition(false);
            setAction(commentaireAction);
          }}
          réformeId={réformeId}
          territoireCode={territoireCode}
          type={type}
        />
      ) : (
        <>
          <AlerteCommentaire action={action} />
          <AffichageCommentaire
            commentaire={commentaire}
            onModifier={modeEcriture ? () => setModeÉdition(true) : undefined}
          />
          <div className="flex justify-end items-center gap-4 mt-2">
            {!!commentaire ? (
              <HistoriqueCommentaire
                maille={maille}
                réformeId={réformeId}
                territoireCode={territoireCode}
                type={type}
              />
            ) : null}
            {modeEcriture &&
              (commentaireBrouillon?.dateModification ? (
                <BoutonEditerBrouillonCommentaire
                  commentaire={commentaire}
                  brouillon={commentaireBrouillon}
                  onAction={setAction}
                />
              ) : (
                <BoutonNouveauCommentaire
                  commentaire={commentaire}
                  onAction={setAction}
                  réformeId={réformeId}
                  territoireCode={territoireCode}
                  type={type}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentaireSection;
