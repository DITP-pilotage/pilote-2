import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire
  from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import { NouveauCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import typesCommentaire from '@/client/constants/typesCommentaire';
import CommentaireStyled from './Commentaire.styled';

export default function Commentaire({ type, commentaire, chantierId }: CommentaireProps) {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [contenu, setContenu] = useState(commentaire?.contenu);
  const [commentaireÉtat, setCommentaireÉtat] = useState(commentaire);
  
  function handlePublierCommentaire(): void {
    const nouveauCommentaire: NouveauCommentaire = {
      typeCommentaire: type,
      maille: 'nationale',
      codeInsee: 'FR',
      détailsCommentaire: { contenu: contenu, date: new Date().toISOString(), auteur: 'Poutoux' },
    };

    fetch(
      `/api/chantier/${chantierId}/commentaire/`, {
        method: 'POST',
        body: JSON.stringify(nouveauCommentaire),
      },
    )
      .then(() => {
        setCommentaireÉtat(nouveauCommentaire.détailsCommentaire);
        setModeÉdition(false);
      });
  }
  
  return (
    <CommentaireStyled>
      <Titre
        baliseHtml='h3'
        className="fr-text--lead fr-mb-1w"
      >
        { modeÉdition ? 'Modifier le commentaire' : typesCommentaire[type] }
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
        commentaire && contenu ?
          (modeÉdition ? (
            <div className='contenu'>
              <label
                className="fr-label fr-sr-only"
                htmlFor="saisie-contenu-commentaire"
        modeÉdition ? (
          <div className='contenu'>
            <label
              className="fr-label fr-sr-only"
              htmlFor="saisie-contenu-commentaire"
            >
              Modification du commentaire
            </label>
            <textarea
              className="fr-input fr-mb-6w"
              id="saisie-contenu-commentaire"
              maxLength={500}
              name="saisie-contenu-commentaire"
              onChange={(e) => setContenu(e.target.value)}
              value={contenu}
            />
            <div className='boutons'>
              <button
                className='fr-btn fr-mr-1w'
                onClick={() => handlePublierCommentaire()}
                type='button'
              >
                Publier
              </button>
              <button
                className='fr-btn fr-btn--secondary'
                onClick={() => setModeÉdition(false)}
                type='button'
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          commentaireÉtat && contenu ? (
            <>
              <p className="fr-text--xs texte-gris fr-mb-1w">
                {`Mis à jour le ${formaterDate(commentaireÉtat.date, 'jj/mm/aaaa')} | par ${commentaireÉtat.auteur}`}
              </p>
              <div className='contenu'>
                <p
                  className="fr-text--sm"
                // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenu),
                  }}
                />
              </div>
            </>
          ) : (
            <p className="fr-text--sm fr-mb-0">
              Aucun commentaire à afficher
            </p>
          )
        )
      }
      <button
        className='fr-btn fr-btn--secondary boutons'
        onClick={() => setModeÉdition(true)}
        type='button'
      >
        Modifier
      </button>
    </CommentaireStyled>
  );
}

