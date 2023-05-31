import { Fragment } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/Publication/Publication';
import { consignesDÉcritureCommentaire, libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { TypeCommentaire, typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/commentaire/Commentaire.interface';
import CommentairesProps from './Commentaires.interface';

export default function Commentaires({ commentaires, réformeId, maille, nomTerritoire, modeÉcriture = false, estInteractif = true }: CommentairesProps) {
  const typesCommentaire = maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale;

  return (
    <Bloc titre={nomTerritoire}>
      {
        typesCommentaire.map((type, i) => (
          <Fragment key={type}>
            {
              i !== 0 && (
                <hr className="fr-hr fr-mx-n2w" />
              )
            }
            <Publication
              caractéristiques={{
                entité: 'commentaires',
                type: type,
                libelléType: libellésTypesCommentaire[type as TypeCommentaire],
                consigneDÉcriture: consignesDÉcritureCommentaire[type as TypeCommentaire],
              }}
              estInteractif={estInteractif}
              maille={maille}
              modeÉcriture={modeÉcriture}
              publicationInitiale={commentaires?.find(commentaire => commentaire?.type === type) || null}
              réformeId={réformeId}
            />
          </Fragment>
        ))
      }
    </Bloc>
  );
}
