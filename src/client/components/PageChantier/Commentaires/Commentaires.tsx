import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CommentairesProps from '@/components/PageChantier/Commentaires/Commentaires.interface';
import typesCommentaire from '@/client/constants/typesCommentaire';
import Commentaire from '@/components/PageChantier/Commentaires/Commentaire/Commentaire';

export default function Commentaires({ commentaires, chantierId }: CommentairesProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  return (
    <section
      id="commentaires"
    >
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Commentaires du chantier
      </Titre>
      <Bloc titre={territoireSélectionné.nom}>
        <div className='fr-mx-2w fr-mt-1w fr-mb-4w'>
          <Commentaire
            chantierId={chantierId}
            commentaire={commentaires['freinsÀLever']}
            titre={typesCommentaire['freinsÀLever']}
            type="freinsÀLever"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-4w'>
          <Commentaire
            chantierId={chantierId}
            commentaire={commentaires['actionsÀVenir']}
            titre={typesCommentaire['actionsÀVenir']}
            type="actionsÀVenir"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-4w'>
          <Commentaire
            chantierId={chantierId}
            commentaire={commentaires['actionsÀValoriser']}
            titre={typesCommentaire['actionsÀValoriser']}
            type="actionsÀValoriser"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-2w'>
          <Commentaire
            chantierId={chantierId}
            commentaire={commentaires['autresRésultatsObtenus']}
            titre={typesCommentaire['autresRésultatsObtenus']}
            type="autresRésultatsObtenus"
          />
        </div>
      </Bloc>
    </section>
  );
}
