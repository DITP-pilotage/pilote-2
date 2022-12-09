import Titre from '@/components/_commons/Titre/Titre';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';

export default function TauxAvancementMoyen() {
  return (
    <>
      <Titre
        apparence='fr-h6'
        baliseHtml='h2'
      >
        Taux d’avancement moyen de la sélection
      </Titre>
      <div>
        <p className="fr-mb-1v">
          annuel
        </p>
        <BarreDeProgression
          taille="lg"
          valeur={0.55}
          variante="secondaire"
        />
        <p className="fr-mb-1v fr-mt-3w">
          global
        </p>
        <BarreDeProgression
          taille="lg"
          valeur={0.4}
          variante="primaire"
        />
      </div>
    </>
  );
}
