export interface ProfilAccess {
  code: string;
  nom: string;
  active: boolean;
}

export interface UtilisateurAccess {
  utilisateurId: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  profilNom: string;
  autoriseViaProfil: boolean;
}

export interface UtilisateurSearchResult extends UtilisateurAccess {
  dejaAjoute: boolean;
}

export interface AlbertAccessRepository {
  listProfils(): Promise<ProfilAccess[]>;
  setProfilActive(profilCode: string, active: boolean): Promise<void>;
  listUtilisateurs(): Promise<UtilisateurAccess[]>;
  searchUtilisateurs(
    email: string,
    limit: number,
  ): Promise<UtilisateurSearchResult[]>;
  findUtilisateurProfil(utilisateurId: string): Promise<string | null>;
  addUtilisateur(utilisateurId: string): Promise<void>;
  removeUtilisateur(utilisateurId: string): Promise<void>;
  getAccessFlags(
    utilisateurId: string,
    profil: string | null,
  ): Promise<{ profilActive: boolean; utilisateurAutorise: boolean }>;
}
