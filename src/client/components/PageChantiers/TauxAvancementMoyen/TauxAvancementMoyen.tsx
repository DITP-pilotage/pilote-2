import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { périmètreGéographique as périmètreGéographiqueStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import calculerLesAvancementsÀPartirDeChantiers from '@/client/utils/chantier/avancement/calculerLesAvancementsÀPartirDeChantiers';
import TauxAvancementMoyenProps from './TauxAvancementMoyen.interface';


export default function TauxAvancementMoyen({ donnéesTerritoiresAgrégées }: TauxAvancementMoyenProps) {
  const périmètreGéographique = périmètreGéographiqueStore();
  const valeursAvancements = useMemo(() => calculerLesAvancementsÀPartirDeChantiers(donnéesTerritoiresAgrégées), [donnéesTerritoiresAgrégées]);
  const avancementsDuTerritoire = useMemo(() => valeursAvancements[périmètreGéographique.maille][périmètreGéographique.codeInsee], [valeursAvancements, périmètreGéographique]);
  
  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Taux d’avancement moyen de la sélection
      </Titre>
      <div>
        <p className="fr-mb-1v">
          annuel
        </p>
        <BarreDeProgression
          maximum={avancementsDuTerritoire.annuel.maximum}
          minimum={avancementsDuTerritoire.annuel.minimum}
          médiane={avancementsDuTerritoire.annuel.médiane}
          taille="grande"
          valeur={avancementsDuTerritoire.annuel.moyenne}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          maximum={avancementsDuTerritoire.global.maximum}
          minimum={avancementsDuTerritoire.global.minimum}
          médiane={avancementsDuTerritoire.global.médiane}
          taille="grande"
          valeur={avancementsDuTerritoire.global.moyenne}
          variante="primaire"
        />
      </div>
    </>
  );
}
