import { Fragment, FunctionComponent } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/PublicationNew/Publication';
import {
  consignesDÉcritureCommentaire,
  libellésTypesCommentaire,
  TypeCommentaire,
} from '@/client/constants/libellésCommentaire';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Commentaire, typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import CommentaireProjetStructurant, { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

interface CommentairesProps {
  commentaires: (Commentaire | CommentaireProjetStructurant)[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  typesCommentaire: typeof typesCommentaireMailleNationale | typeof typesCommentaireMailleRégionaleOuDépartementale | typeof typesCommentaireProjetStructurant
  modeÉcriture?: boolean
  estInteractif?: boolean
  territoireCode: string
}

const Commentaires: FunctionComponent<CommentairesProps> = ({
  commentaires,
  réformeId,
  maille,
  nomTerritoire,
  typesCommentaire,
  modeÉcriture = false,
  estInteractif = true,
  territoireCode,
}) => {
  
  return (
    <Bloc titre={nomTerritoire}>
      {
        typesCommentaire.map((type, i) => (
          <Fragment key={type}>
            {
              i !== 0 && (
                <hr className='fr-hr fr-mx-n2w' />
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
              territoireCode={territoireCode}
            />
          </Fragment>
        ))
      }
    </Bloc>
  );
};

export default Commentaires;
