import { erreur_validation_fichier as ErreurValidationFichierModel, PrismaClient } from '@prisma/client';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';
import {
  ErreurValidationFichierRepository,
} from '@/server/import-indicateur/domain/ports/ErreurValidationFichierRepository';

const convertirEnModel = (erreurValidationFichier: ErreurValidationFichier): Omit<ErreurValidationFichierModel, 'date_import'> => {
  return {
    id: erreurValidationFichier.id,
    rapport_id: erreurValidationFichier.rapportId,
    nom: erreurValidationFichier.nom,
    cellule: erreurValidationFichier.cellule,
    message: erreurValidationFichier.message,
    nom_du_champ: erreurValidationFichier.nomDuChamp,
    numero_de_ligne: erreurValidationFichier.numeroDeLigne,
    position_de_ligne: erreurValidationFichier.positionDeLigne,
    position_du_champ: erreurValidationFichier.positionDuChamp,
  };
};

export class PrismaErreurValidationFichierRepository implements ErreurValidationFichierRepository {
  constructor(private prisma: PrismaClient) {}

  async sauvegarder(listeErreursValidationFichier: ErreurValidationFichier[]): Promise<void> {
    const listeErreursValidationFichierModel = listeErreursValidationFichier.map(convertirEnModel);

    await this.prisma.erreur_validation_fichier.createMany({ data: listeErreursValidationFichierModel });
  }
}
