export interface TokenAPIService {
  creerTokenAPI({ email }: { email: string }): Promise<string>
}
