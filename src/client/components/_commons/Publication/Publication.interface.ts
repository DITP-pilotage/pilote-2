import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
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
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  modeÉcriture: boolean
  estInteractif: boolean
}
