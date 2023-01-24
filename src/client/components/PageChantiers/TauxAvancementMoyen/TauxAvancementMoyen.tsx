import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { périmètreGéographique as périmètreGéographiqueStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import compterLesAvancementsÀPartirDeChantiers from '@/client/utils/chantier/avancement/calculerLesAvancementsÀPartirDeChantiers';
import TauxAvancementMoyenProps from './TauxAvancementMoyen.interface';


export default function TauxAvancementMoyen({ chantiers }: TauxAvancementMoyenProps) {
  const périmètreGéographique = périmètreGéographiqueStore();
  const valeursAvancements = useMemo(() => compterLesAvancementsÀPartirDeChantiers(chantiers), [chantiers]);
  const avancementsDuTerritoire = valeursAvancements[périmètreGéographique.maille][périmètreGéographique.codeInsee];
  
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
          maximum={avancementsDuTerritoire.maximumAnnuel}
          minimum={avancementsDuTerritoire.minimumAnnuel}
          médiane={avancementsDuTerritoire.médianeAnnuel}
          taille="grande"
          valeur={avancementsDuTerritoire.annuel}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          maximum={avancementsDuTerritoire.maximumGlobal}
          minimum={avancementsDuTerritoire.minimumGlobal}
          médiane={avancementsDuTerritoire.médianeGlobal}
          taille="grande"
          valeur={avancementsDuTerritoire.global}
          variante="primaire"
        />
      </div>
    </>
  );
}
