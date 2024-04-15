export function useRemontéesAlertesChantiers(territoireCode: string, filtresComptesCalculés: Record<string, { nombre: number }>) {
  const [maille] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  return {
    remontéesAlertes: [
      mailleChantier === 'nationale'
        ? {
          nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
          libellé: 'Taux d’avancement non calculé(s) en raison d’indicateurs non renseignés',
          nombre: filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé.nombre,
          estActivée: false,
        } 
        : {
          nomCritère: 'estEnAlerteÉcart',
          libellé: 'Retard supérieur de 10 points par rapport à la moyenne nationale',
          nombre: filtresComptesCalculés.estEnAlerteÉcart.nombre,
          estActivée: false,
        },
      {
        nomCritère: 'estEnAlerteBaisseOuStagnation',
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: filtresComptesCalculés.estEnAlerteBaisseOuStagnation.nombre,
        estActivée: false,
      },
      {
        nomCritère: 'estEnAlerteDonnéesNonMàj',
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: filtresComptesCalculés.estEnAlerteDonnéesNonMàj.nombre,
        estActivée: false,
      },
    ],
  };
}
