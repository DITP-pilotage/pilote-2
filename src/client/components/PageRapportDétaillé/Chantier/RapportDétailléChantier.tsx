import Link from 'next/link';
import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import EnTêteChantier from '@/components/_commons/EnTêteChantier/EnTêteChantier';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';

interface RapportDétailléChantierProps {
  chantier: Chantier
}

export default function RapportDétailléChantier({ chantier }: RapportDétailléChantierProps) {
  return (
    <section
      className="fr-mt-4w"
      id={htmlId.chantier(chantier.id)}
    >
      <Link
        className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-up-line fr-btn--icon-left fr-text--sm"
        href={`#${htmlId.listeDesChantiers()}`}
        title="Revenir à la liste des chantiers"
      >
        Haut de page
      </Link>
      <Encart>
        <EnTêteChantier
          axe={chantier.axe}
          nom={chantier.nom}
          ppg={chantier.ppg}
        />
      </Encart>
    </section>
  );
}
