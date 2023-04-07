import { Fragment } from 'react';
import useHistoriqueDUnCommentaire from '@/components/PageChantier/Commentaires/Commentaire/Historique/useHistoriqueDUnCommentaire';
import Modale from '@/components/_commons/Modale/Modale';
import Publication from '@/components/PageChantier/Publication/Publication';
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
              commentaire && 
                <Fragment key={commentaire.id}>
                  {
                  i !== 0 && (
                    <hr className="fr-mt-4w" />
                  )
                }
                  <div className="fr-mx-2w">
                    <Publication
                      auteur={commentaire.auteur}
                      contenu={commentaire.contenu}
                      date={commentaire.date}
                      messageSiAucunContenu="Le commentaire est vide."
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
