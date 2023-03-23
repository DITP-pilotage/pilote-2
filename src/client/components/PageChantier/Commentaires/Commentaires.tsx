import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import CommentairesProps from '@/components/PageChantier/Commentaires/Commentaires.interface';
import typesCommentaire from '@/client/constants/typesCommentaire';
import Commentaire from '@/components/PageChantier/Commentaires/Commentaire/Commentaire';

export default function Commentaires({ commentaires }: CommentairesProps) {
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
            // commentaire={commentaires['freinsÀLever']}
            commentaire={{
              auteur: 'Jean Bon',
              contenu: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo. Vestibulum aliquam hendrerit molestie. Mauris malesuada nisi sit amet augue accumsan tincidunt. Maecenas tincidunt, velit ac porttitor pulvinar, tortor eros facilisis libero, vitae commodo nunc quam et ligula. Ut nec ipsum sapien. Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer id nisi nec nulla luctus lacinia non eu turpis. Etiam in ex imperdiet justo tincidunt egestas. Ut porttitor urna ac augue cursus tincidunt sit amet sed orci.',
              date:'12/04/2023',
            }}
            titre={typesCommentaire['freinsÀLever']}
            typeCommentaire="freinsÀLever"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-4w'>
          <Commentaire
            commentaire={commentaires['actionsÀVenir']}
            titre={typesCommentaire['actionsÀVenir']}
            typeCommentaire="actionsÀVenir"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-4w'>
          <Commentaire
            commentaire={commentaires['actionsÀValoriser']}
            titre={typesCommentaire['actionsÀValoriser']}
            typeCommentaire="actionsÀValoriser"
          />
        </div>
        <hr className='fr-hr fr-mx-n2w' />
        <div className='fr-mx-2w fr-mt-1w fr-mb-2w'>
          <Commentaire
            commentaire={commentaires['autresRésultatsObtenus']}
            titre={typesCommentaire['autresRésultatsObtenus']}
            typeCommentaire="autresRésultatsObtenus"
          />
        </div>
      </Bloc>
    </section>
  );
}
