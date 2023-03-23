import { Fragment } from 'react';
import sha1 from 'sha1';
import Titre from '@/components/_commons/Titre/Titre';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import {
  useHistoriqueDuCommentaire,
} from '@/components/PageChantier/Commentaires/Commentaire/Historique/useHistoriqueDuCommentaire';
import HistoriqueDuCommentaireProps from './HistoriqueDuCommentaire.interface';
import HistoriqueDuCommentaireStyled from './HistoriqueDuCommentaire.styled';

export default function HistoriqueDuCommentaire({ typeCommentaire }: HistoriqueDuCommentaireProps) {

  const { historiqueDuCommentaire, territoireSélectionné, estModaleOuverte, setEstModaleOuverte } = useHistoriqueDuCommentaire(typeCommentaire);

  return (
    <HistoriqueDuCommentaireStyled>
      <button
        className="fr-link fr-link--icon-left fr-fi-arrow-right-line fr-mt-2w bouton-ouvrir-modale"
        onClick={() => {
          setEstModaleOuverte(!estModaleOuverte);
        }}
        type="button"
      >
        Voir l&apos;historique
      </button>
      {
        estModaleOuverte ? (
          <dialog
            aria-modal={estModaleOuverte}
            className={`fr-modal ${estModaleOuverte ? 'fr-modal--opened' : ''}`}
            open={estModaleOuverte}
          >
            <div className="fr-container fr-container--fluid fr-container-md">
              <div className="fr-modal__body fr-col-12 fr-col-md-10 fr-col-lg-9 fr-mx-auto commentaires-conteneur">
                <div className="fr-modal__header fr-pb-0">
                  <button
                    className="fr-link--close fr-link bouton-fermer-modale"
                    onClick={() => setEstModaleOuverte(false)}
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
                    {territoireSélectionné.nom}
                  </p>
                </div>
                <div className="fr-modal__content fr-px-4w fr-mb-4w commentaires">
                  <div>
                    {
                      historiqueDuCommentaire === null ? (
                        <p>
                          Chargement de l&apos;historique...
                        </p>
                      ) : (
                        historiqueDuCommentaire.map((versionDuCommentaire, indice) => (
                          <Fragment key={sha1(versionDuCommentaire.contenu)}>
                            {
                              indice !== 0 && (
                                <hr className="fr-mt-4w" />
                              )
                            }
                            <div className="fr-mx-2w">
                              <p className="fr-text--xs texte-gris fr-mb-1w">
                                {`Mis à jour le ${formaterDate(versionDuCommentaire.date, 'jj/mm/aaaa')} | par ${versionDuCommentaire.auteur}`}
                              </p>
                              <p
                                className="fr-text--sm fr-mb-0"
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                  __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(versionDuCommentaire.contenu),
                                }}
                              />
                            </div>
                          </Fragment>
                        ))
                      )
                    }
                  </div>
                </div>
              </div>
            </div>
            {
              estModaleOuverte ?
                <div
                  aria-hidden
                  className="arrière-plan"
                  onClick={() => setEstModaleOuverte(false)}
                />
                : null
            }
          </dialog>
        )
          : null
      }
    </HistoriqueDuCommentaireStyled>
  );
}
