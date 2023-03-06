import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import useCommentaire from '@/components/PageChantier/Commentaires/Commentaire/useCommentaire';
import { formaterDate } from '@/client/utils/date/date';

export default function Commentaire({ titre, commentaire }: CommentaireProps) {
  const { rendreLeHtml } = useCommentaire();

  return (
    <>
      <Titre
        baliseHtml='h3'
        className="fr-text--lead fr-mb-1w"
      >
        { titre }
      </Titre>
      {
        commentaire ? (
          <>
            <p className="fr-text--xs texte-gris fr-mb-1w">
              {`Mis à jour le ${formaterDate(commentaire.date, 'jj/mm/aaaa')} | par ${commentaire.auteur}`}
            </p>
            <p
              className="fr-text--sm fr-mb-0"
              // TODO trouver mieux que dangerouslySetInnerHTML
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: rendreLeHtml(commentaire.contenu),
              }}
            />
          </>
        ) : (
          <p className="fr-text--sm fr-mb-0">
            Aucun commentaire à afficher
          </p>
        )
      }
    </>
  );
}
