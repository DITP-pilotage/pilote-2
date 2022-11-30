import Title from 'client/components/_commons/Title/Title';

export default function TauxAvancementMoyen() {
  return (
    <div className="fr-grid-row fr-p-1w">
      <Title
        as='h3'
        look='fr-h6'
      >
        Taux d’avancement moyen de la sélection
      </Title>
      <div className="fr-col-12 fr-col-xl-6">
        barre annuel
      </div>      
      <div className="fr-col fr-col-xl-6">
        barre global
      </div>
    </div>
  );
}