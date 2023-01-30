import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { périmètreGéographique as périmètreGéographiqueStore } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import calculerLesAvancementsÀPartirDeChantiers from '@/client/utils/chantier/avancement/calculerLesAvancementsÀPartirDeChantiers';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
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
        <div className="fr-col-12 fr-col-lg-5">
          <JaugeDeProgression
            couleur='bleu'
            libellé="Taux d'avancement global"
            pourcentage={avancementsDuTerritoire.global.moyenne}
            taille='grande'
          />
        </div>
        <div className="fr-col-12 fr-col-lg-7">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
            <div className="fr-col-3">
              <JaugeDeProgression
                couleur='orange'
                libellé="Minimum"
                pourcentage={avancementsDuTerritoire.global.minimum}
                taille='petite'
              />
            </div>
            <div className="fr-col-3">
              <JaugeDeProgression
                couleur='violet'
                libellé="Médiane"
                pourcentage={avancementsDuTerritoire.global.médiane}
                taille='petite'
              />
            </div>
            <div className="fr-col-3">
              <JaugeDeProgression
                couleur='vert'
                libellé="Maximum"
                pourcentage={avancementsDuTerritoire.global.maximum}
                taille='petite'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
