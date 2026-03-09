import { FunctionComponent } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import { formaterDate } from "@/client/utils/date/date";
import { libellésTypesCommentaire } from "@/client/constants/libellésCommentaire";
import AlerteCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import HistoriqueCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Historique/Historique";
import CommentaireFormulaire from "@/components/_commons/CommentairesNew/CommentaireSection/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";

interface CommentaireSectionProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  réformeId: string;
  territoireCode: string;
  maille: Maille;
  modeEcriture?: boolean;
}

const CommentaireSection: FunctionComponent<CommentaireSectionProps> = ({
  type,
  commentaire,
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

  return (
    <div className="px-2 py-4">
      <p className="font-bold text-xl mb-1">{libellésTypesCommentaire[type]}</p>
      {commentaire?.dateDernierBrouillon ? (
        <div className="my-2">
          <BandeauInformation bandeauType="INFO">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${formaterDate(commentaire.dateDernierBrouillon, "DD/MM/YYYY")}`}
          </BandeauInformation>
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <CommentaireFormulaire
          annulationCallback={() => setModeÉdition(false)}
          commentaire={commentaire}
          maille={maille}
          réformeId={réformeId}
          territoireCode={territoireCode}
          type={type}
        />
      ) : (
        <>
          <AlerteCommentaire type={type} />
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
              (commentaire?.dateDernierBrouillon ? (
                <BoutonEditerBrouillonCommentaire
                  commentaire={commentaire}
                  maille={maille}
                  réformeId={réformeId}
                  territoireCode={territoireCode}
                  type={type}
                />
              ) : (
                <BoutonNouveauCommentaire
                  commentaire={commentaire}
                  maille={maille}
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
