import Titre from 'client/components/_commons/Titre/Titre';

export default function TauxAvancementMoyen() {
  return (
    <div className="fr-grid-row fr-p-1w">
      <Titre
        apparence='fr-h6'
        baliseHtml='h2'
      >
        Taux d’avancement moyen de la sélection
      </Titre>
      <div className="fr-col-12 fr-col-xl-6">
        barre annuel
      </div>      
      <div className="fr-col fr-col-xl-6">
        barre global
      </div>
    </div>
  );
}