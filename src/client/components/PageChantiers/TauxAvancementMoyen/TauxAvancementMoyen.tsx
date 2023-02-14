import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { périmètreGéographique as périmètreGéographiqueStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import calculerLesAvancementsÀPartirDeChantiers from '@/client/utils/chantier/avancement/calculerLesAvancementsÀPartirDeChantiers';
import Avancements from '@/components/_commons/Avancements/Avancements';
import TauxAvancementMoyenProps from './TauxAvancementMoyen.interface';

export default function TauxAvancementMoyen({ donnéesTerritoiresAgrégées }: TauxAvancementMoyenProps) {
  const périmètreGéographique = périmètreGéographiqueStore();
  const valeursAvancements = useMemo(() => calculerLesAvancementsÀPartirDeChantiers(donnéesTerritoiresAgrégées), [donnéesTerritoiresAgrégées]);
  const avancementsDuTerritoire = useMemo(() => valeursAvancements[périmètreGéographique.maille][périmètreGéographique.codeInsee], [valeursAvancements, périmètreGéographique]);
  
  return (
    <div className='fr-container--fluid'>
      <div className="fr-grid-row">
        <Titre
          baliseHtml='h2'
          className='fr-h6'
        >
          Taux d’avancement moyen de la sélection
        </Titre>
        <Avancements
          maximum={avancementsDuTerritoire.global.maximum}
          minimum={avancementsDuTerritoire.global.minimum}
          moyenne={avancementsDuTerritoire.global.moyenne}
          médiane={avancementsDuTerritoire.global.médiane}
        />
      </div>
    </div>
  );
}
