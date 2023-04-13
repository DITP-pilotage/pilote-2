import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/Publication/Publication';
import Titre from '@/components/_commons/Titre/Titre';
import DécisionsStratégiquesProps from './DécisionsStratégiques.interface';

export default function DécisionsStratégiques({ décisionsStratégiques, chantierId, modeÉcriture }: DécisionsStratégiquesProps) {
  return (
    <section id="décisions-stratégiques">
      <Titre
        baliseHtml="h2"
        className="fr-h4 fr-mb-2w"
      >
        Décisions stratégiques
      </Titre>
      <Bloc titre='France'>
        <Publication 
          chantierId={chantierId}
          codeInsee='FR'
          entité="décisions stratégiques"
          maille="nationale"
          modeÉcriture={modeÉcriture}
          publicationInitiale={décisionsStratégiques ? décisionsStratégiques[0].publication : null}
          type={{
            id: 'suivi_des_decisions',
            libellé: 'Suivi des décisions stratégiques',
          }}
        />
      </Bloc>
    </section>
  );
}
