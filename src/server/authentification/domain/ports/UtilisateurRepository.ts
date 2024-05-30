export interface UtilisateurRepository {
  estPresent: ({ email }: { email: string }) => Promise<boolean>
}
