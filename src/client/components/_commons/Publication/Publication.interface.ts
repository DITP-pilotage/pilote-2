import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { RouterInputs, RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface PublicationProps {
  type: {
    id: RouterInputs['publication']['récupérerLaPlusRécente']['type'],
    libellé: string
  },
  entité: RouterInputs['publication']['récupérerLaPlusRécente']['entité'],
  publicationInitiale: RouterOutputs['publication']['récupérerLaPlusRécente'],
  chantierId: Chantier['id']
  maille: Maille
  codeInsee: CodeInsee
  modeÉcriture: boolean
}
