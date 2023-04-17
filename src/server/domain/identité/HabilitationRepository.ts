import { Habilitation } from '@/server/domain/identité/Habilitation';

export default interface HabilitationRepository {
  récupèreHabilitationsPourUtilisateur(email: string): Promise<Habilitation>
  supprimeHabilitationsPourUtilisateur(email: string): Promise<void>
}
