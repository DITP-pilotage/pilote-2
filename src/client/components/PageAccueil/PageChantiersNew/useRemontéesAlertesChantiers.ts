import { parseAsBoolean, useQueryStates } from 'nuqs';

export function useRemontéesAlertesChantiers(territoireCode: string, filtresComptesCalculés: Record<string, { nombre: number }>) {
  const [maille] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisseOuStagnation: parseAsBoolean.withDefault(false),
    estEnAlerteDonnéesNonMàj: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
  });

  return {
    remontéesAlertes: [
      mailleChantier === 'nationale'
        ? {
          nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
          libellé: 'Taux d’avancement non calculé(s) en raison d’indicateurs non renseignés',
          nombre: filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé.nombre,
          estActivée: filtresAlertes.estEnAlerteTauxAvancementNonCalculé,
        } 
        : {
          nomCritère: 'estEnAlerteÉcart',
          libellé: 'Retard supérieur de 10 points par rapport à la moyenne nationale',
          nombre: filtresComptesCalculés.estEnAlerteÉcart.nombre,
          estActivée: filtresAlertes.estEnAlerteÉcart,
        },
      {
        nomCritère: 'estEnAlerteBaisseOuStagnation',
        libellé: 'Tendance(s) en baisse ou en stagnation',
        nombre: filtresComptesCalculés.estEnAlerteBaisseOuStagnation.nombre,
        estActivée: filtresAlertes.estEnAlerteBaisseOuStagnation,
      },
      {
        nomCritère: 'estEnAlerteDonnéesNonMàj',
        libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
        nombre: filtresComptesCalculés.estEnAlerteDonnéesNonMàj.nombre,
        estActivée: filtresAlertes.estEnAlerteDonnéesNonMàj,
      },
      {
        nomCritère: 'estEnAlerteMétéoNonRenseignée',
        libellé: 'Météo(s) non renseignée(s)',
        nombre: filtresComptesCalculés.estEnAlerteMétéoNonRenseignée.nombre,
        estActivée: filtresAlertes.estEnAlerteMétéoNonRenseignée,
      },
    ],
  };
}
