import { parseAsBoolean, useQueryStates } from 'nuqs';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';

export function useRemontéesAlertesChantiers(territoireCode: string, filtresComptesCalculés: Record<TypeAlerteChantier, number>) {
  const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleChantier = maille === 'NAT' ? 'nationale' : maille === 'REG' ? 'régionale' : 'départementale';

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  });

  const alerteAbscenceTauxAvancementDepartemental = {
    nomCritère: 'estEnAlerteAbscenceTauxAvancementDepartemental',
    libellé: 'Chantier(s) sans taux d’avancement au niveau départemental',
    nombre: filtresComptesCalculés.estEnAlerteAbscenceTauxAvancementDepartemental,
    estActivée: filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental,
  };

  const alerteTauxAvancementNonCalculé = {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    libellé: 'Taux d’avancement non calculé(s) en raison d’indicateurs non renseignés',
    nombre: filtresComptesCalculés.estEnAlerteTauxAvancementNonCalculé,
    estActivée: filtresAlertes.estEnAlerteTauxAvancementNonCalculé,
  };

  const alerteEcart = {
    nomCritère: 'estEnAlerteÉcart',
    libellé: `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleChantier}`,
    nombre: filtresComptesCalculés.estEnAlerteÉcart,
    estActivée: filtresAlertes.estEnAlerteÉcart,
  };

  const alerteBaisse = {
    nomCritère: 'estEnAlerteBaisse',
    libellé: 'Chantier(s) avec tendance en baisse',
    nombre: filtresComptesCalculés.estEnAlerteBaisse,
    estActivée: filtresAlertes.estEnAlerteBaisse,
  };

  const alerteMétéoNonRenseignée = {
    nomCritère: 'estEnAlerteMétéoNonRenseignée',
    libellé: 'Chantier(s) avec météo et synthèse des résultats non renseignés',
    nombre: filtresComptesCalculés.estEnAlerteMétéoNonRenseignée,
    estActivée: filtresAlertes.estEnAlerteMétéoNonRenseignée,
  };

  const alertesNationales = [alerteTauxAvancementNonCalculé, alerteAbscenceTauxAvancementDepartemental, alerteMétéoNonRenseignée];
  const alertesTerritoriales = [alerteEcart, alerteBaisse, alerteMétéoNonRenseignée];

  return {
    remontéesAlertes: mailleChantier === 'nationale' ? alertesNationales : alertesTerritoriales,
  };
}
