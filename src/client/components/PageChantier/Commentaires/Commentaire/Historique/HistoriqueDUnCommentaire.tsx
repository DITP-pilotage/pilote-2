import { Fragment, useEffect, useRef, useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import {
  useHistoriqueDUnCommentaire,
} from '@/components/PageChantier/Commentaires/Commentaire/Historique/useHistoriqueDUnCommentaire';
import HistoriqueDUnCommentaireProps from './HistoriqueDUnCommentaire.interface';
import HistoriqueDUnCommentaireStyled from './HistoriqueDUnCommentaire.styled';

export default function HistoriqueDUnCommentaire({ type }: HistoriqueDUnCommentaireProps) {

  const modale = useRef<HTMLDialogElement>(null);
  const [estAffiché, setEstAffiché] = useState(false);

  useEffect(() => {
    const modaleHTML = modale.current;
    if (!modaleHTML)
      return;

    const àLaFermetureDeLaModale = () => setEstAffiché(false);
    const àLOuvertureDeLaModale = () => setEstAffiché(true);

    modaleHTML.addEventListener('dsfr.conceal', àLaFermetureDeLaModale);
    modaleHTML.addEventListener('dsfr.disclose', àLOuvertureDeLaModale);

    return () => {
      modaleHTML?.removeEventListener('dsfr.conceal', àLaFermetureDeLaModale);
      modaleHTML?.removeEventListener('dsfr.disclose', àLOuvertureDeLaModale);
    };
  }, [modale]);

  const { historiqueDUnCommentaire, territoireSélectionné } = useHistoriqueDUnCommentaire(type, estAffiché);

  return (
    <HistoriqueDUnCommentaireStyled>
      <button
        aria-controls={`historique-commentaire-${type}`}
        className="fr-link fr-link--icon-left fr-fi-arrow-right-line fr-mt-2w bouton-ouvrir-modale"
        data-fr-opened="false"
        type="button"
      >
        Voir l&apos;historique
      </button>
      <dialog
        className="fr-modal"
        id={`historique-commentaire-${type}`}
        ref={modale}
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body fr-col-12 fr-col-md-10 fr-col-lg-9 fr-mx-auto commentaires-conteneur">
            <div className="fr-modal__header fr-pb-0">
              <button
                aria-controls={`historique-commentaire-${type}`}
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
                {territoireSélectionné.nom}
              </p>
            </div>
            <div className="fr-modal__content fr-px-4w fr-mb-4w commentaires">
              <div>
                {
                  historiqueDUnCommentaire === null ? (
                    <p>
                      Chargement de l&apos;historique...
                    </p>
                  ) : (
                    historiqueDUnCommentaire.map((commentaire, i) => (
                      <Fragment key={commentaire.date}>
                        {
                          i !== 0 && (
                            <hr className="fr-mt-4w" />
                          )
                        }
                        <div className="fr-mx-2w">
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
                        </div>
                      </Fragment>
                    ))
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </HistoriqueDUnCommentaireStyled>
  );
}
