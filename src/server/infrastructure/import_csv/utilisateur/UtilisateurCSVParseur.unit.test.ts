/* eslint-disable sonarjs/no-duplicate-string */
import fs from 'node:fs';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import UtilisateurCSVParseur from './UtilisateurCSVParseur';

describe('UtilisateurCSVParseur', () => {
  it("lit un fichier CSV et retourne un tableau d'utilisateur à créer ou mettre à jour", () => {
    const utilisateurÀImporter1 = new UtilisateurÀCréerOuMettreÀJourBuilder().build();

    const utilisateurÀImporter2 = new UtilisateurÀCréerOuMettreÀJourBuilder().build();

    const contenuFichierCSV = `nom,prénom,email,profil,scope,territoires,périmètreIds,chantierIds\n
      ${utilisateurÀImporter1.nom},${utilisateurÀImporter1.prénom},"${utilisateurÀImporter1.email}",${utilisateurÀImporter1.profil},lecture,REG-12|DEPT-13,PER-15,CH-001|CH-002|CH-003\n
      ${utilisateurÀImporter1.nom},${utilisateurÀImporter1.prénom},"${utilisateurÀImporter1.email}",${utilisateurÀImporter1.profil},saisie.commentaire,DEPT-13,,CH-001|CH-002\n
      ${utilisateurÀImporter2.nom},${utilisateurÀImporter2.prénom},"${utilisateurÀImporter2.email}",${utilisateurÀImporter2.profil},lecture,,PER-25,CH-004|CH-008|CH-012\n
      ${utilisateurÀImporter2.nom},${utilisateurÀImporter2.prénom},"${utilisateurÀImporter2.email}",${utilisateurÀImporter2.profil},saisie.commentaire,,,CH-004\n
      ${utilisateurÀImporter2.nom},${utilisateurÀImporter2.prénom},"${utilisateurÀImporter2.email}",${utilisateurÀImporter2.profil},saisie.indicateur,,PER-25,`;

    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(contenuFichierCSV);

    const result = new UtilisateurCSVParseur('monfichier.csv').parse();
    expect(result).toStrictEqual([
      {
        nom: utilisateurÀImporter1.nom.toLowerCase(),
        prénom: utilisateurÀImporter1.prénom.toLowerCase(),
        email: utilisateurÀImporter1.email.toLowerCase(),
        profil: utilisateurÀImporter1.profil,
        fonction: null,
        habilitations: {
          lecture: {
            chantiers: ['CH-001', 'CH-002', 'CH-003'],
            territoires: ['REG-12', 'DEPT-13'],
            périmètres:  ['PER-15'],
          },
          'saisie.indicateur': {
            chantiers: [],
            territoires: [],
            périmètres: [],
          },
          'saisie.commentaire': {
            chantiers: ['CH-001', 'CH-002'],
            territoires: ['DEPT-13'],
            périmètres: [],
          },
        },
      },
      {
        ...utilisateurÀImporter2,
        nom: utilisateurÀImporter2.nom.toLowerCase(),
        prénom: utilisateurÀImporter2.prénom.toLowerCase(),
        email: utilisateurÀImporter2.email.toLowerCase(),
        profil: utilisateurÀImporter2.profil,
        fonction: null,
        habilitations: {
          lecture: {
            chantiers: ['CH-004', 'CH-008', 'CH-012'],
            territoires: [],
            périmètres:  ['PER-25'],
          },
          'saisie.indicateur': {
            chantiers: [],
            territoires: [],
            périmètres: ['PER-25'],
          },
          'saisie.commentaire': {
            chantiers: ['CH-004'],
            territoires: [],
            périmètres: [],
          },
        },
      }]);
  });
});
