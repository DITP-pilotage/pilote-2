import Bloc from '@/components/_commons/Bloc/Bloc';
import Publication from '@/components/_commons/Publication/Publication';
import Titre from '@/components/_commons/Titre/Titre';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';
import DécisionsStratégiquesProps from './DécisionsStratégiques.interface';

export default function DécisionsStratégiques({ décisionStratégique, chantierId, modeÉcriture = false, estInteractif = true }: DécisionsStratégiquesProps) {
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
          caractéristiques={{
            type: 'suiviDesDécisionsStratégiques',
            libelléType: libellésTypesDécisionStratégique.suiviDesDécisionsStratégiques,
            entité: 'décisions stratégiques',
            consigneDÉcriture: 'Notez les décisions prises lors des réunions Elysée <> Matignon (AKAR) et indiquez les actions envisagées et/ou réalisées pour mettre en œuvre ou répondre à ces décisions.',
          }}
          estInteractif={estInteractif}
          maille="nationale"
          modeÉcriture={modeÉcriture}
          publicationInitiale={décisionStratégique}
          réformeId={chantierId}
        />
      </Bloc>
    </section>
  );
}
