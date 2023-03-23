import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire
  from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';

export default function Commentaire({ titre, commentaire, type }: CommentaireProps) {
  return (
    <section>
      <Titre
        baliseHtml='h3'
        className="fr-text--lead fr-mb-1w"
      >
        { titre }
      </Titre>
      {
        commentaire ? (
          <>
            <Publication
              auteur={commentaire.auteur}
              contenu={commentaire.contenu}
              date={commentaire.date}
              messageSiAucunContenu="Le commentaire est vide."
            />
            <HistoriqueDUnCommentaire
              type={type}
            />
          </>
        ) : (
          <p className="fr-text--sm fr-mb-0">
            Aucun commentaire à afficher
          </p>
        )
      }
    </section>
  );
}
