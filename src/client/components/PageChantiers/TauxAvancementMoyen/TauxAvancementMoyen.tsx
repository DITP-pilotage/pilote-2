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
          taille="grande"
          valeur={{
            minimum: 0,
            moyenne: 0.45,
            médiane: 0.55,
            maximum: 0.555,
          }}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          taille="grande"
          valeur={{
            minimum: 0.665,
            médiane: 0.67,
            moyenne: 0.58,
            maximum: 1,
          }}
          variante="primaire"
        />
      </div>
    </>
  );
}
