import { parseAsBoolean, useQueryStates } from 'nuqs';

export function useRemontéesAlertesChantiers(territoireCode: string, filtresComptesCalculés: Record<string, { nombre: number }>) {
  const [maille] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteDonnéesNonMàj: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  });

  const alerteAbscenceTauxAvancementDepartemental = {
    nomCritère: 'estEnAlerteAbscenceTauxAvancementDepartemental',
    libellé: "Abscence de taux d'avancement au niveau départemental",
    nombre: filtresComptesCalculés.estEnAlerteAbscenceTauxAvancementDepartemental.nombre,
    estActivée: filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental,
  };

  const alerteTauxAvancementNonCalculé = {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    libellé: 'Taux d’avancement non calculé(s) en raison d’indicateurs non renseignés',
    nombre: filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé.nombre,
    estActivée: filtresAlertes.estEnAlerteTauxAvancementNonCalculé,
  };

  const alerteEcart = {
    nomCritère: 'estEnAlerteÉcart',
    libellé: 'Retard supérieur de 10 points par rapport à la moyenne nationale',
    nombre: filtresComptesCalculés.estEnAlerteÉcart.nombre,
    estActivée: filtresAlertes.estEnAlerteÉcart,
  };

  const alerteBaisse = {
    nomCritère: 'estEnAlerteBaisse',
    libellé: 'Tendance(s) en baisse',
    nombre: filtresComptesCalculés.estEnAlerteBaisse.nombre,
    estActivée: filtresAlertes.estEnAlerteBaisse,
  };

  const alerteDonnéesNonMaj = {
    nomCritère: 'estEnAlerteDonnéesNonMàj',
    libellé: 'Météo(s) ou commentaire(s) non renseigné(s) ou non mis à jour',
    nombre: filtresComptesCalculés.estEnAlerteDonnéesNonMàj.nombre,
    estActivée: filtresAlertes.estEnAlerteDonnéesNonMàj,
  };

  const alertesNationales = [alerteTauxAvancementNonCalculé, alerteAbscenceTauxAvancementDepartemental, alerteDonnéesNonMaj];
  const alertesTerritoriales = [alerteEcart, alerteBaisse, alerteDonnéesNonMaj];

  return {
    remontéesAlertes: mailleChantier === 'nationale' ? alertesNationales : alertesTerritoriales,
  };
}
