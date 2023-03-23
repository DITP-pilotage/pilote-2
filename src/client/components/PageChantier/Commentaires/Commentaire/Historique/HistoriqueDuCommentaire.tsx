import Titre from '@/components/_commons/Titre/Titre';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import HistoriqueDuCommentaireProps from './HistoriqueDuCommentaire.interface';
import HistoriqueDuCommentaireStyled from './HistoriqueDuCommentaire.styled';

export default function HistoriqueDuCommentaire({
  auteur,
  chaîneDeCaractères,
  sousTitre,
  sqlDate,
  typeCommentaire,
}: HistoriqueDuCommentaireProps) {
  return (
    <HistoriqueDuCommentaireStyled
      className="fr-modal"
      id={`modale-historique-commentaires-${typeCommentaire}`}
    >
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10 fr-col-lg-9">
            <div className="fr-modal__body commentaires-conteneur">
              <div className="fr-modal__header fr-pb-0">
                <button
                  aria-controls={`modale-historique-commentaires-${typeCommentaire}`}
                  className="fr-link--close fr-link bouton-fermer-modale"
                  title="Fermer la fenêtre modale"
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <div className="fr-mx-4w">
                <Titre
                  baliseHtml="h1"
                  className="fr-modal__title fr-mb-1w"
                >
                  Historique - Commentaires
                </Titre>
                <p className="fr-text--lg bold">
                  {sousTitre}
                </p>
              </div>
              <div className="fr-modal__content fr-px-4w fr-mb-7v commentaires">
                <div className="commentaires">
                  {
                Array.from({ length: 5 }).map(() => (
                  <>
                    <div className="fr-mx-2w">
                      <p className="fr-text--xs texte-gris fr-mb-1w">
                        {`Mis à jour le ${formaterDate(sqlDate, 'jj/mm/aaaa')} | par ${auteur}`}
                      </p>
                      <p
                        className="fr-text--sm fr-mb-0"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(chaîneDeCaractères),
                        }}
                      />
                    </div>
                    <hr className="fr-mt-4w" />
                  </>
                ))
              }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HistoriqueDuCommentaireStyled>
  );
}
