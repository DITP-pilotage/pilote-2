import { Fragment } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CommentairesProps from '@/components/_commons/Commentaires/Commentaires.interface';
import Publication from '@/components/_commons/Publication/Publication';
import { consignesDÉcritureCommentaire, libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { TypeCommentaire, typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/commentaire/Commentaire.interface';

export default function Commentaires({ commentaires, réformeId, maille, codeInsee, modeÉcriture = false, estInteractif = true }: CommentairesProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const typesCommentaire = maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale;

  return (
    <section id="commentaires">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Commentaires du chantier
      </Titre>
      <Bloc titre={territoireSélectionné!.nomAffiché}>
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
                codeInsee={codeInsee}
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
    </section>
  );
}
