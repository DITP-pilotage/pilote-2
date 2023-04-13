import { Fragment } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CommentairesProps from '@/components/PageChantier/Commentaires/Commentaires.interface';
import Publication from '@/components/_commons/Publication/Publication';
import typesCommentaire from '@/client/constants/typesCommentaire';
import { TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default function Commentaires({ commentaires, chantierId, maille, codeInsee, modeÉcriture }: CommentairesProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  return (
    <section id="commentaires">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Commentaires du chantier
      </Titre>
      <Bloc titre={territoireSélectionné.nom}>
        {
          !!commentaires &&
            commentaires.map(({ publication, type }, i) => (
              <Fragment key={type}>
                {
                  i !== 0 && (
                    <hr className="fr-hr fr-mx-n2w" />
                  )
                }
                <Publication
                  chantierId={chantierId}
                  codeInsee={codeInsee}
                  entité="commentaires"
                  maille={maille}
                  modeÉcriture={modeÉcriture}
                  publicationInitiale={publication}
                  type={{ id: type, libellé: typesCommentaire[type as TypeCommentaire] }}
                />
              </Fragment>
            ))
        }
      </Bloc>
    </section>
  );
}
