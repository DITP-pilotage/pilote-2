import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';

export default function Commentaire({ titre, commentaire }: CommentaireProps) {
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
              {`Mis à jour le ${commentaire.date} | par ${commentaire.auteur}`}
            </p>
            <p className="fr-text--sm fr-mb-0">
              {commentaire.contenu}
            </p>
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
