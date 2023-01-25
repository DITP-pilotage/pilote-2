import Chantier from '@/server/domain/chantier/Chantier.interface';

type AvancementBarreDeProgression = { moyenne: null | number, médiane: null | number, minimum: null | number, maximum: null | number };

export type AvancementsBarreDeProgression = {
  annuel: AvancementBarreDeProgression, 
  global: AvancementBarreDeProgression, 
};
export default interface TauxAvancementMoyenProps {
  chantiers: Chantier[]
}
