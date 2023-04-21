import { RouterOutputs, RouterInputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default interface PublicationFormulaireProps {
  type: RouterInputs['publication']['créer']['type']
  entité: RouterInputs['publication']['créer']['entité']
  contenuInitial?: RouterInputs['publication']['créer']['contenu']
  succèsCallback?: (publicationCréée: RouterOutputs['publication']['créer']) => void
  erreurCallback?: (message: string) => void
  annulationCallback?: () => void
}

export type PublicationFormulaireInputs = Pick<RouterInputs['publication']['créer'], 'contenu' | 'type' | 'entité' | 'maille' | 'codeInsee' | 'chantierId'>;
