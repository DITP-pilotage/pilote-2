import { useEffect, useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { calculerMoyenne, calculerMédiane, valeurMaximum, valeurMinimum } from '@/client/utils/statistiques';
import TauxAvancementMoyenProps, { AvancementsBarreDeProgression } from './TauxAvancementMoyen.interface';

export default function TauxAvancementMoyen({ chantiers }: TauxAvancementMoyenProps) {
  const [valeursAvancementNational, setValeursAvancementNational] = useState<AvancementsBarreDeProgression>({ 
    annuel: { moyenne: null, médiane: null, minimum: null, maximum: null }, 
    global: { moyenne: null, médiane: null, minimum: null, maximum: null }, 
  });

  useEffect(() => {
    const listeAvancementsNationauxAnnuel = chantiers.map(chantier => (chantier.mailles.nationale.FR.avancement.annuel));
    const listeAvancementsNationauxGlobaux = chantiers.map(chantier => (chantier.mailles.nationale.FR.avancement.global));

    setValeursAvancementNational({ 
      annuel: { 
        moyenne: calculerMoyenne(listeAvancementsNationauxAnnuel), 
        médiane: calculerMédiane(listeAvancementsNationauxAnnuel), 
        minimum: valeurMinimum(listeAvancementsNationauxAnnuel), 
        maximum: valeurMaximum(listeAvancementsNationauxAnnuel), 
      }, 
      global: { 
        moyenne: calculerMoyenne(listeAvancementsNationauxGlobaux), 
        médiane: calculerMédiane(listeAvancementsNationauxAnnuel), 
        minimum: valeurMinimum(listeAvancementsNationauxGlobaux), 
        maximum: valeurMaximum(listeAvancementsNationauxGlobaux), 
      },
    });
  }, [chantiers]);
  
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
          maximum={valeursAvancementNational.annuel.maximum}
          minimum={valeursAvancementNational.annuel.minimum}
          médiane={valeursAvancementNational.annuel.médiane}
          taille="grande"
          valeur={valeursAvancementNational.annuel.moyenne}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          maximum={valeursAvancementNational.global.maximum}
          minimum={valeursAvancementNational.global.minimum}
          médiane={valeursAvancementNational.global.médiane}
          taille="grande"
          valeur={valeursAvancementNational.global.moyenne}
          variante="primaire"
        />
      </div>
    </>
  );
}
