import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import { ObjectifProjetStructurantProps as ObjectifsPageProjetStructurantProps } from './Objectifs.interface';

export default function ObjectifsPageProjetStructurant({ nomTerritoire }: ObjectifsPageProjetStructurantProps) {
  return (
    <section id="objectifs">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Objectifs
      </Titre>
      <Bloc titre={nomTerritoire}>
        placeholder
      </Bloc>
    </section>
  );
}
