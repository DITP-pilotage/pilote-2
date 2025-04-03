import Chantier from '@/server/chantiers/domain/Chantier.interface';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface DécisionsStratégiquesProps {
  décisionStratégique: RouterOutputs['publication']['récupérerLaPlusRécente'], 
  chantierId: Chantier['id'],
  territoireCode: string
  modeÉcriture?: boolean
  estInteractif?: boolean
}
