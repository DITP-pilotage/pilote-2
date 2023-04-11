import { Habilitation } from '@/server/domain/identité/Habilitation';

export default interface HabilitationRepository {
  récupèreHabilitationsPourUtilisateur(utilisateurId: string): Promise<Habilitation>
}
