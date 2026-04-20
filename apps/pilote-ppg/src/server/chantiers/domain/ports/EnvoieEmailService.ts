export interface EnvoieEmailService {
  envoieUnEmail(
    destinataires: { email: string }[],
    templateId: number,
    parametres: object,
  ): Promise<void>;
}
