import { TokenAPIInformation } from '@/server/authentification/domain/TokenAPIInformation';

export interface TokenAPIInformationRepository {
  recupererTokenAPIInformation({ email }: { email: string }): Promise<TokenAPIInformation | null>
  listerTokenAPIInformation(): Promise<TokenAPIInformation[]>
  sauvegarderTokenAPIInformation({ email, dateCreation }: { email: string, dateCreation: string }): Promise<void>
  supprimerTokenAPIInformation({ email }: { email: string }): Promise<void>
}
