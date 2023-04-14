import Chantier from '@/server/domain/chantier/Chantier.interface';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface DécisionsStratégiquesProps {
  décisionStratégique: RouterOutputs['publication']['récupérerLaPlusRécenteParType'], 
  chantierId: Chantier['id'],
  modeÉcriture: boolean
}
