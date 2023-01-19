import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { calculerMoyenne } from '@/client/utils/statistiques';
import TauxAvancementMoyenProps from './TauxAvancementMoyen.interface';

export default function TauxAvancementMoyen({ chantiers }: TauxAvancementMoyenProps) {
  const moyenneAvancementNational = useMemo(() => ({
    annuel: calculerMoyenne(chantiers.map(chantier => (chantier.mailles.nationale.FR.avancement.annuel))),
    global: calculerMoyenne(chantiers.map(chantier => (chantier.mailles.nationale.FR.avancement.global))),
  }), [chantiers]);

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
          taille="grande"
          valeur={moyenneAvancementNational.annuel}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          taille="grande"
          valeur={moyenneAvancementNational.global}
          variante="primaire"
        />
      </div>
    </>
  );
}
