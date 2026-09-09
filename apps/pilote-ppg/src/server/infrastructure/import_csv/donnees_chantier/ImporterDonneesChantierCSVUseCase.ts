import { PrismaClient } from "@prisma/client";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import {
  DomaineCible,
  ErreurLigneCSVDonneesChantier,
  LigneRepartie,
  LigneRepartieCommentaire,
  LigneRepartieDecisionStrategique,
  LigneRepartieObjectif,
  LigneRepartieSyntheseDesResultats,
  répartirLigne,
  validerLignesCSV,
} from "@/validation/import-csv-donnees-chantier";

const EMAIL_UTILISATEUR_IMPORT = "import.csv@modernisation.gouv.fr";

export type RésultatImportDonneesChantierCSV =
  | {
      succès: true;
      comptesParDomaine: Record<DomaineCible, number>;
    }
  | {
      succès: false;
      erreurs: ErreurLigneCSVDonneesChantier[];
    };

export class ImporterDonneesChantierCSVUseCase {
  constructor(
    private readonly dependencies: {
      prisma: PrismaClient;
      importerCommentairesUseCase: ImporterCommentairesUseCase;
      importerSynthesesDesResultatsUseCase: ImporterSynthesesDesResultatsUseCase;
      importerDecisionsStrategiquesUseCase: ImporterDecisionsStrategiquesUseCase;
      importerObjectifsUseCase: ImporterObjectifsUseCase;
    },
  ) {}

  async execute(
    lignesBrutes: unknown[],
  ): Promise<RésultatImportDonneesChantierCSV> {
    const { lignesValides, erreurs } = validerLignesCSV(lignesBrutes);

    if (erreurs.length > 0) {
      return { succès: false, erreurs };
    }

    const lignesReparties = lignesValides.map(répartirLigne);
    const auteurIdParEmail = await this._résoudreAuteurs(lignesReparties);

    const groupes = this._grouperParChantierEtAuteur(
      lignesReparties,
      auteurIdParEmail,
    );

    const comptesParDomaine: Record<DomaineCible, number> = {
      commentaire: 0,
      synthese_des_resultats: 0,
      decision_strategique: 0,
      objectif: 0,
    };

    for (const groupe of groupes.values()) {
      await this._importerGroupe(groupe);
      comptesParDomaine[groupe.domaine] += groupe.lignes.length;
    }

    return { succès: true, comptesParDomaine };
  }

  private async _résoudreAuteurs(
    lignes: LigneRepartie[],
  ): Promise<Map<string, string>> {
    const emails = [
      ...new Set(
        lignes
          .map((ligne) => ligne.auteurEmail?.toLowerCase())
          .filter((email): email is string => !!email),
      ),
    ];

    const utilisateurs = await this.dependencies.prisma.utilisateur.findMany({
      where: { email: { in: [...emails, EMAIL_UTILISATEUR_IMPORT] } },
      select: { id: true, email: true },
    });

    const utilisateurImport = utilisateurs.find(
      (utilisateur) => utilisateur.email === EMAIL_UTILISATEUR_IMPORT,
    );
    if (!utilisateurImport) {
      throw new Error(
        `Utilisateur système d'import introuvable : ${EMAIL_UTILISATEUR_IMPORT}`,
      );
    }

    const auteurIdParEmail = new Map<string, string>();
    for (const email of emails) {
      const utilisateur = utilisateurs.find((u) => u.email === email);
      auteurIdParEmail.set(email, utilisateur?.id ?? utilisateurImport.id);
    }
    auteurIdParEmail.set(EMAIL_UTILISATEUR_IMPORT, utilisateurImport.id);

    return auteurIdParEmail;
  }

  private _grouperParChantierEtAuteur(
    lignes: LigneRepartie[],
    auteurIdParEmail: Map<string, string>,
  ): Map<
    string,
    {
      domaine: DomaineCible;
      chantierId: string;
      auteurId: string;
      lignes: LigneRepartie[];
    }
  > {
    const groupes = new Map<
      string,
      {
        domaine: DomaineCible;
        chantierId: string;
        auteurId: string;
        lignes: LigneRepartie[];
      }
    >();

    for (const ligne of lignes) {
      const auteurId = ligne.auteurEmail
        ? (auteurIdParEmail.get(ligne.auteurEmail.toLowerCase()) as string)
        : (auteurIdParEmail.get(EMAIL_UTILISATEUR_IMPORT) as string);

      const clé = `${ligne.domaine}::${ligne.chantierId}::${auteurId}`;
      const groupeExistant = groupes.get(clé);

      if (groupeExistant) {
        groupeExistant.lignes.push(ligne);
      } else {
        groupes.set(clé, {
          domaine: ligne.domaine,
          chantierId: ligne.chantierId,
          auteurId,
          lignes: [ligne],
        });
      }
    }

    return groupes;
  }

  private async _importerGroupe(groupe: {
    domaine: DomaineCible;
    chantierId: string;
    auteurId: string;
    lignes: LigneRepartie[];
  }): Promise<void> {
    const { domaine, chantierId, auteurId, lignes } = groupe;

    switch (domaine) {
      case "commentaire": {
        const lignesCommentaire = lignes as LigneRepartieCommentaire[];
        await this.dependencies.importerCommentairesUseCase.execute({
          chantierId,
          auteurId,
          commentaires: lignesCommentaire.map((ligne) => ligne.input),
        });
        return;
      }
      case "synthese_des_resultats": {
        const lignesSynthese = lignes as LigneRepartieSyntheseDesResultats[];
        await this.dependencies.importerSynthesesDesResultatsUseCase.execute({
          chantierId,
          auteurId,
          syntheses: lignesSynthese.map((ligne) => ligne.input),
        });
        return;
      }
      case "decision_strategique": {
        const lignesDecision = lignes as LigneRepartieDecisionStrategique[];
        await this.dependencies.importerDecisionsStrategiquesUseCase.execute({
          chantierId,
          auteurId,
          decisionsStrategiques: lignesDecision.map((ligne) => ligne.input),
        });
        return;
      }
      case "objectif": {
        const lignesObjectif = lignes as LigneRepartieObjectif[];
        await this.dependencies.importerObjectifsUseCase.execute({
          chantierId,
          auteurId,
          objectifs: lignesObjectif.map((ligne) => ligne.input),
        });
      }
    }
  }
}
