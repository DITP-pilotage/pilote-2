import '@gouvfr/dsfr/dist/component/modal/modal.min.css';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Titre from '@/components/_commons/Titre/Titre';
import CommentaireProps from '@/components/PageChantier/Commentaires/Commentaire/Commentaire.interface';
import HistoriqueDUnCommentaire
  from '@/components/PageChantier/Commentaires/Commentaire/Historique/HistoriqueDUnCommentaire';
import Publication from '@/components/PageChantier/Publication/Publication';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import typesCommentaire from '@/client/constants/typesCommentaire';
import CompteurCaractères from '@/components/_commons/CompteurCaractères/CompteurCaractères';
import CommentaireStyled from './Commentaire.styled';
import useCommentaire from './useCommentaire';

export default function Commentaire({ type, commentaire, chantierId }: CommentaireProps) {
  const [contenu, setContenu] = useState(commentaire?.contenu);
  const [compte, setCompte] = useState(contenu?.length ?? 0);
  const limiteDeCaractères = 500;
  const { data: session } = useSession();

  const { 
    handlePublierCommentaire, 
    modeÉdition, 
    setModeÉdition, 
    commentaireÉtat,
    afficherAlerte,
    setAfficherAlerte,
  } = useCommentaire(commentaire);
  
  return (
    <CommentaireStyled>
      {afficherAlerte ?
        <div className="fr-alert fr-alert--success fr-mb-2w">
          <h3 className="fr-alert__title">
            Commentaire modifié
          </h3>
        </div>
        : null}
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
          <>
            <div className={`fr-mb-0 fr-input-group ${compte === limiteDeCaractères && 'fr-input-group--error'}`}>
              <label
                className="fr-label fr-sr-only"
                htmlFor="saisie-contenu-commentaire"
              >
                Modification du commentaire
              </label>
              <textarea
                className={`fr-input fr-text--sm fr-mb-0 ${compte === limiteDeCaractères && 'fr-input--error'}`}
                id="saisie-contenu-commentaire"
                maxLength={limiteDeCaractères}
                name="saisie-contenu-commentaire"
                onChange={(e) => {
                  setContenu(e.target.value);
                  setCompte(e.target.value.length);
                }}
                rows={6}
                value={contenu}
              />
              {compte === limiteDeCaractères &&
              <p
                className="fr-error-text"
                id="text-input-error-desc-error"
              >
                Limite de caractères atteinte
              </p>}
            </div>
            <CompteurCaractères
              compte={compte}
              limiteDeCaractères={limiteDeCaractères}
            />
            <div className='boutons'>
              <button
                className='fr-btn fr-mr-1w'
                onClick={() => contenu && session?.user?.name && handlePublierCommentaire(contenu, type, session?.user?.name, chantierId)}
                type='button'
              >
                Publier
              </button>
              <button
                className='fr-btn fr-btn--secondary'
                onClick={() => {
                  setContenu(commentaire?.contenu);
                  setModeÉdition(false);
                }}
                type='button'
              >
                Annuler
              </button>
            </div>
          </>
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
              <button
                className='fr-btn fr-btn--secondary boutons'
                onClick={() => {
                  setModeÉdition(true);
                  setAfficherAlerte(false);
                }}
                type='button'
              >
                Modifier
              </button>
            </>
          ) : (
            <>
              <p className="fr-text--sm fr-mb-0">
                Aucun commentaire à afficher
              </p>
              <button
                className='fr-btn fr-btn--secondary boutons'
                onClick={() => setModeÉdition(true)}
                type='button'
              >
                Ajouter
              </button>
            </>
          )
        )
      }
    </CommentaireStyled>
  );
}

