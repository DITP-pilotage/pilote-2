import { Fragment } from 'react';
import { formaterDate } from '@/client/utils/date/date';
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from '@/client/utils/strings';
import useHistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/useHistoriqueDUnCommentaire';
import Modale from '@/components/_commons/Modale/Modale';
import HistoriqueDUnCommentaireProps from './HistoriqueDUnCommentaire.interface';

export default function HistoriqueDUnCommentaire({ type }: HistoriqueDUnCommentaireProps) {

  const { historiqueDUnCommentaire, territoireSélectionné, setEstModaleOuverte } = useHistoriqueDUnCommentaire(type);

  return (
    <Modale
      idHtml={`historique-commentaire-${type}`}
      libelléBouton="Voir l'historique"
      setEstAffichée={setEstModaleOuverte}
      sousTitre={territoireSélectionné.nom}
      titre="Historique - Commentaires"
    >
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
    </Modale>
  );
}
