import { Fragment, useEffect, useRef, useState } from 'react';
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

  const modale = useRef<HTMLDialogElement>(null);
  const [estAffiché, setEstAffiché] = useState(false);

  useEffect(() => {
    if (!modale.current)
      return;

    const àLaFermetureDeLaModale = () => setEstAffiché(false);
    const àLOuvertureDeLaModale = () => setEstAffiché(true);

    modale.current.addEventListener('dsfr.conceal', àLaFermetureDeLaModale);
    modale.current.addEventListener('dsfr.disclose', àLOuvertureDeLaModale);

    return () => {
      modale.current?.removeEventListener('dsfr.conceal', àLaFermetureDeLaModale);
      modale.current?.removeEventListener('dsfr.disclose', àLOuvertureDeLaModale);
    };
  }, [modale]);

  const { historiqueDuCommentaire, territoireSélectionné } = useHistoriqueDuCommentaire(typeCommentaire, estAffiché);

  return (
    <HistoriqueDuCommentaireStyled>
      <button
        aria-controls={`historique-commentaire-${typeCommentaire}`}
        className="fr-link fr-link--icon-left fr-fi-arrow-right-line fr-mt-2w bouton-ouvrir-modale"
        data-fr-opened="false"
        type="button"
      >
        Voir l&apos;historique
      </button>
      <dialog
        className="fr-modal"
        id={`historique-commentaire-${typeCommentaire}`}
        ref={modale}
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body fr-col-12 fr-col-md-10 fr-col-lg-9 fr-mx-auto commentaires-conteneur">
            <div className="fr-modal__header fr-pb-0">
              <button
                aria-controls={`historique-commentaire-${typeCommentaire}`}
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
      </dialog>
    </HistoriqueDuCommentaireStyled>
  );
}
