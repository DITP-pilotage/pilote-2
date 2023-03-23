import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import HistoriqueDuCommentaire
  from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDuCommentaire';

export default function Commentaire({ titre, commentaire, typeCommentaire }: CommentaireProps) {
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
            <p className="fr-text--xs texte-gris fr-mb-1w">
              {`Mis à jour le ${formaterDate(commentaire.date, 'jj/mm/aaaa')} | par ${commentaire.auteur}`}
            </p>
            <p
              className="fr-text--sm fr-mb-0"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(commentaire.contenu),
              }}
            />
            <HistoriqueDuCommentaire
              typeCommentaire={typeCommentaire}
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
