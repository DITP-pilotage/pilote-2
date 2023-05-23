import { RouterOutputs, RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import { PublicationCaractéristiques } from '@/components/_commons/Publication/Publication.interface';

export default interface PublicationFormulaireProps {
  contenuInitial?: RouterInputs['publication']['créer']['contenu']
  succèsCallback?: (publicationCréée: RouterOutputs['publication']['créer']) => void
  erreurCallback?: (message: string) => void
  annulationCallback?: () => void
  caractéristiques: PublicationCaractéristiques
}

export type PublicationFormulaireInputs = Pick<RouterInputs['publication']['créer'], 'contenu' | 'type' | 'entité' | 'territoireCode' | 'réformeId'>;
