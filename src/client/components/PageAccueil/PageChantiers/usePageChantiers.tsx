import api from '@/server/infrastructure/api/trpc/api';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import {
  AvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import useVueDEnsemble from './useVueDEnsemble';

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([ProfilEnum.COORDINATEUR_DEPARTEMENT, ProfilEnum.RESPONSABLE_DEPARTEMENT]);

export default function usePageChantiers(chantiers: ChantierAccueilContrat[], territoireCode: string, filtresComptesCalculés: Record<TypeAlerteChantier, number>, avancementsAgrégés: AvancementsStatistiquesAccueilContrat, profil: string) {
  const {
    chantiersVueDEnsemble,
    remontéesAlertes,
  } = useVueDEnsemble(chantiers, territoireCode, filtresComptesCalculés, avancementsAgrégés);

  const estAutoriseAVoirLeSelecteurDeMaille = !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(profil);

  const { data: estExportV2Actif } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_EXPORT_CSV_V2' });

  return {
    donnéesTableauChantiers: chantiersVueDEnsemble,
    remontéesAlertes,
    estAutoriseAVoirLeSelecteurDeMaille,
    estExportV2Actif,
  };
}
