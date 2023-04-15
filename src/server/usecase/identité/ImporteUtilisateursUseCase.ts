import assert from 'node:assert/strict';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { UtilisateurIAMRepository } from '@/server/domain/identité/UtilisateurIAMRepository';
import { UtilisateurRepository } from '@/server/domain/identité/UtilisateurRepository';
import UtilisateurDTO from '@/server/domain/identité/UtilisateurDTO';

export default class ImporteUtilisateursUseCase {
  constructor(
    private readonly utilisateursÀImporter: UtilisateurPourImport[],
    private readonly utilisateurRepository: UtilisateurRepository = dependencies.getUtilisateurRepository(),
    private readonly utilisateurIAMRepository: UtilisateurIAMRepository = dependencies.getUtilisateurIAMRepository(),
  ) {
    assert(utilisateursÀImporter);
    assert.notDeepEqual([], utilisateursÀImporter);
  }

  async run(): Promise<void> {
    const utilisateursPourIAM = this.utilisateursÀImporter.map(
      it => it.pourIAM(),
    );
    const utilisateursPourImportPilote: UtilisateurDTO[] = this.utilisateursÀImporter.map(
      it => ({
        email: it.email,
        nom: it.nom,
        prénom: it.prénom,
        profilCode: it.profilCode,
        chantierIds: it.chantierIds,
      }),
    );

    // TODO: qu'est-ce qu'on fait si l'un réussit et pas l'autre ?
    await this.utilisateurIAMRepository.ajouteUtilisateurs(utilisateursPourIAM);
    await this.utilisateurRepository.créerOuRemplaceUtilisateurs(utilisateursPourImportPilote);
  }
}
