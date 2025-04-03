import Chantier from '@/server/chantiers/domain/Chantier.interface';
import { Maille } from '@/server/chantiers/domain/Maille';
import { RouterInputs, RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export type PublicationCaractéristiques = {
  entité: RouterInputs['publication']['récupérerLaPlusRécente']['entité'],
  type: RouterInputs['publication']['récupérerLaPlusRécente']['type'],
  libelléType: string,
  consigneDÉcriture?: string,
};

export default interface PublicationProps {
  caractéristiques: PublicationCaractéristiques
  publicationInitiale: RouterOutputs['publication']['récupérerLaPlusRécente'],
  réformeId: Chantier['id']
  maille: Maille
  modeÉcriture: boolean
  estInteractif: boolean
}
