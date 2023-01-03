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
            médiane: 55,
            moyenne: 45,
            maximum: 60,
          }}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          taille="grande"
          valeur={{
            minimum: 20.5,
            médiane: 55,
            moyenne: 70,
            maximum: 100,
          }}
          variante="primaire"
        />
      </div>
    </>
  );
}
