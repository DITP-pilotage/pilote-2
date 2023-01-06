import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';

export default function TauxAvancementMoyen() {
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
          maximum={60}
          minimum={0}
          médiane={55}
          taille="grande"
          valeur={45}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          maximum={100}
          minimum={20.5}
          médiane={55}
          taille="grande"
          valeur={70}
          variante="primaire"
        />
      </div>
    </>
  );
}
