import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { PrismaChantierRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaChantierRepository";
import { RecupererChantiersSynthetisesUseCase } from "@/server/gestion-utilisateur/usecases/RecupererChantiersSynthetisesUseCase";
import { PrismaPerimetreMinisterielRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaPerimetreMinisteriel";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import RecupererPerimetresMinisterielsUseCase from "@/server/gestion-utilisateur/usecases/RecupererPerimetresMinisterielsUseCase";
import { RecupererListeProfilUseCase } from "@/server/usecase/profil/RecupererListeProfilUseCase";
import { ProfilRepository } from "@/server/gestion-utilisateur/domain/ports/ProfilRepository";
import { PrismaProfilRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaProfilRepository";
import { PrismaTerritoireRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaTerritoireRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { RecupererTerritoiresAvecNombreUtilisateursUseCase } from "@/server/gestion-utilisateur/usecases/RecupererTerritoiresAvecNombreUtilisateursUseCase";
import { FiltrerListeUtilisateursUseCase } from "@/server/gestion-utilisateur/usecases/FiltrerListeUtilisateursUseCase";
import { RecupererTousLesTerritoiresUseCase } from "@/server/usecase/territoire/RecupererTousLesTerritoiresUseCase";
import { RecupererListeUtilisateursUseCase } from "@/server/gestion-utilisateur/usecases/RecupererListeUtilisateursUseCase";
import { PrismaHistorisationModificationRepository } from "@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import { UtilisateurRepository } from "./domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "./domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "./domain/ports/TokenAPIInformationRepository";
import DesactiverUnUtilisateurUseCase from "./usecases/DesactiverUnUtilisateurUseCase";
import { PrismaUtilisateurRepository } from "./infrastructure/adapters/PrismaUtilisateurRepository";
import { UtilisateurIAMKeycloakRepository } from "./infrastructure/adapters/UtilisateurIAMKeycloakRepository";
import { PrismaTokenAPIInformationRepository } from "./infrastructure/adapters/PrismaTokenAPIInformationRepository";
import ReactiverUnUtilisateurUseCase from "./usecases/ReactiverUnUtilisateurUseCase";
import { RecupererEtatVisualisationVideoAccueilUseCase } from "./usecases/RecupererEtatVisualisationVideoAccueilUseCase";
import { DesactiverVideoAccueilUseCase } from "./usecases/DesactiverVideoAccueilUseCase";
import { CommentaireRepository } from "./domain/ports/CommentaireRepository";
import { DecisionStrategiqueRepository } from "./domain/ports/DecisionStrategiqueRepository";
import { ObjectifRepository } from "./domain/ports/ObjectifRepository";
import { RapportRepository } from "./domain/ports/RapportRepository";
import { SyntheseDesResultatsRepository } from "./domain/ports/SyntheseDesResultatsRepository";
import { PrismaCommentaireRepository } from "./infrastructure/adapters/PrismaCommentaireRepository";
import { PrismaDecisionStrategiqueRepository } from "./infrastructure/adapters/PrismaDecisionStrategiqueRepository";
import { PrismaObjectifRepository } from "./infrastructure/adapters/PrismaObjectifRepository";
import { PrismaRapportRepository } from "./infrastructure/adapters/PrismaRapportRepository";
import { PrismaSyntheseDesResultatsRepository } from "./infrastructure/adapters/PrismaSyntheseDesResultatsRepository";
import { SupprimerLesComptesDesactivesUseCase } from "./usecases/SupprimerLesComptesDesactivesUseCase";
import { RecupererLaListeDesInfomrationsChantiersUse } from "./usecases/RecupererLaListeDesInfomrationsChantiersUse";
import { PropositionValeurAvancementRepository } from "./domain/ports/PropositionValeurAvancementRepository";
import { PrismaPropositionValeurAvancementRepository } from "./infrastructure/adapters/PrismaPropositionValeurAvancementRepository";
import { ContactInfoLettresService } from "./domain/ports/ContactInfoLettresService";
import { BrevoContactInfoLettresService } from "./infrastructure/adapters/BrevoContactInfoLettresService";
import CréerOuMettreÀJourUnUtilisateurUseCase from "./usecases/CréerOuMettreÀJourUnUtilisateurUseCase";
import { EnvoyerMailInscriptionInfolettreUseCase } from "./usecases/EnvoyerMailInscriptionInfolettreUseCase";
import { RecupererEtatModaleInscriptionUseCase } from "./usecases/RecupererEtatModaleInscriptionUseCase";
import { DesactiverPopupInfolettreUseCase } from "./usecases/DesactiverPopupInfolettreUseCase";
import { AjouterUnContactAUneInfoLettreUseCase } from "./usecases/AjouterUnContactAUneInfoLettreUseCase";
import { PrismaHabilitationService } from "./infrastructure/adapters/PrismaHabilitationService";
import { HabilitationService } from "./domain/ports/HabilitationService";
import { ActionCompteInactifRepository } from "./domain/ports/ActionCompteInactifRepository";
import { PrismaActionCompteInactifRepository } from "./infrastructure/adapters/PrismaActionCompteInactifRepository";
import { CreerLesActionsComptesInactifsUseCase } from "./usecases/CreerLesActionsComptesInactifsUseCase";
import { EnvoyerLesRelancesUseCase } from "./usecases/EnvoyerLesRelancesUseCase";
import { DesactiverLesComptesInactifsUseCase } from "./usecases/DesactiverLesComptesInactifsUseCase";
import ImporterDesUtilisateursUseCase from "./usecases/ImporterDesUtilisateursUseCase";
import { PrismaActiviteComptesQuery } from "./infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "./infrastructure/queries/PrismaUtilisateursQuery";

type GestionUtilisateurExports = {
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
};

type GestionUtilisateurCradle = GestionUtilisateurExports & {
  utilisateurRepository: UtilisateurRepository;
  territoireRepository: TerritoireRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  chantierRepository: ChantierRepository;
  perimetreMinisterielRepository: PerimetreMinisterielRepository;
  profilRepository: ProfilRepository;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  desactiverUnUtilisateurUseCase: DesactiverUnUtilisateurUseCase;
  reactiverUnUtilisateurUseCase: ReactiverUnUtilisateurUseCase;
  commentaireRepository: CommentaireRepository;
  decisionStrategiqueRepository: DecisionStrategiqueRepository;
  objectifRepository: ObjectifRepository;
  rapportRepository: RapportRepository;
  syntheseDesResultatsRepository: SyntheseDesResultatsRepository;
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  historisationModification: HistorisationModificationRepository;
  supprimerLesComptesDesactivesUseCase: SupprimerLesComptesDesactivesUseCase;
  recupererChantiersSynthetisesUseCase: RecupererChantiersSynthetisesUseCase;
  recupererPerimetresMinisterielsUseCase: RecupererPerimetresMinisterielsUseCase;
  recupererListeProfilUseCase: RecupererListeProfilUseCase;
  recupererTerritoiresAvecNombreUtilisateursUseCase: RecupererTerritoiresAvecNombreUtilisateursUseCase;
  filtrerListeUtilisateursUseCase: FiltrerListeUtilisateursUseCase;
  recupererTousLesTerritoiresUseCase: RecupererTousLesTerritoiresUseCase;
  recupererListeUtilisateursUseCase: RecupererListeUtilisateursUseCase;
  recupererEtatVisualisationVideoAccueilUseCase: RecupererEtatVisualisationVideoAccueilUseCase;
  desactiverVideoAccueilUseCase: DesactiverVideoAccueilUseCase;
  recupererLaListeDesInfomrationsChantiersUse: RecupererLaListeDesInfomrationsChantiersUse;
  contactInfoLettresService: ContactInfoLettresService;
  créerOuMettreÀJourUnUtilisateurUseCase: CréerOuMettreÀJourUnUtilisateurUseCase;
  envoyerMailInscriptionInfolettreUseCase: EnvoyerMailInscriptionInfolettreUseCase;
  recupererEtatModaleInscriptionUseCase: RecupererEtatModaleInscriptionUseCase;
  desactiverPopupInfolettreUseCase: DesactiverPopupInfolettreUseCase;
  ajouterUnContactAUneInfoLettreUseCase: AjouterUnContactAUneInfoLettreUseCase;
  habilitationService: HabilitationService;
  actionCompteInactifRepository: ActionCompteInactifRepository;
  creerLesActionsComptesInactifsUseCase: CreerLesActionsComptesInactifsUseCase;
  envoyerLesRelancesUseCase: EnvoyerLesRelancesUseCase;
  desactiverLesComptesInactifsUseCase: DesactiverLesComptesInactifsUseCase;
  importerDesUtilisateursUseCase: ImporterDesUtilisateursUseCase;
};

export const gestionUtilisateurModule = defineModule<
  GestionUtilisateurExports,
  GestionUtilisateurCradle
>()({
  name: "gestionUtilisateur",
  imports: ["shared"],
  exports: ["activiteComptesQuery", "utilisateursQuery"],
  register: (container, { asModuleClass }) => {
    container.register({
      activiteComptesQuery: asModuleClass(PrismaActiviteComptesQuery),
      utilisateursQuery: asModuleClass(PrismaUtilisateursQuery),
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
      territoireRepository: asModuleClass(PrismaTerritoireRepository),
      utilisateurIAMRepository: asModuleClass(UtilisateurIAMKeycloakRepository),
      chantierRepository: asModuleClass(PrismaChantierRepository),
      perimetreMinisterielRepository: asModuleClass(
        PrismaPerimetreMinisterielRepository,
      ),
      profilRepository: asModuleClass(PrismaProfilRepository),
      tokenAPIInformationRepository: asModuleClass(
        PrismaTokenAPIInformationRepository,
      ),
      historisationModification: asModuleClass(
        PrismaHistorisationModificationRepository,
      ),
      desactiverUnUtilisateurUseCase: asModuleClass(
        DesactiverUnUtilisateurUseCase,
      ),
      reactiverUnUtilisateurUseCase: asModuleClass(
        ReactiverUnUtilisateurUseCase,
      ),
      recupererChantiersSynthetisesUseCase: asModuleClass(
        RecupererChantiersSynthetisesUseCase,
      ),
      recupererPerimetresMinisterielsUseCase: asModuleClass(
        RecupererPerimetresMinisterielsUseCase,
      ),
      recupererListeProfilUseCase: asModuleClass(RecupererListeProfilUseCase),
      recupererTerritoiresAvecNombreUtilisateursUseCase: asModuleClass(
        RecupererTerritoiresAvecNombreUtilisateursUseCase,
      ),
      filtrerListeUtilisateursUseCase: asModuleClass(
        FiltrerListeUtilisateursUseCase,
      ),
      recupererTousLesTerritoiresUseCase: asModuleClass(
        RecupererTousLesTerritoiresUseCase,
      ),
      recupererListeUtilisateursUseCase: asModuleClass(
        RecupererListeUtilisateursUseCase,
      ),
      recupererEtatVisualisationVideoAccueilUseCase: asModuleClass(
        RecupererEtatVisualisationVideoAccueilUseCase,
      ),
      desactiverVideoAccueilUseCase: asModuleClass(
        DesactiverVideoAccueilUseCase,
      ),
      commentaireRepository: asModuleClass(PrismaCommentaireRepository),
      decisionStrategiqueRepository: asModuleClass(
        PrismaDecisionStrategiqueRepository,
      ),
      objectifRepository: asModuleClass(PrismaObjectifRepository),
      rapportRepository: asModuleClass(PrismaRapportRepository),
      syntheseDesResultatsRepository: asModuleClass(
        PrismaSyntheseDesResultatsRepository,
      ),
      propositionValeurAvancementRepository: asModuleClass(
        PrismaPropositionValeurAvancementRepository,
      ),
      supprimerLesComptesDesactivesUseCase: asModuleClass(
        SupprimerLesComptesDesactivesUseCase,
      ),
      recupererLaListeDesInfomrationsChantiersUse: asModuleClass(
        RecupererLaListeDesInfomrationsChantiersUse,
      ),
      contactInfoLettresService: asModuleClass(BrevoContactInfoLettresService),
      créerOuMettreÀJourUnUtilisateurUseCase: asModuleClass(
        CréerOuMettreÀJourUnUtilisateurUseCase,
      ),
      envoyerMailInscriptionInfolettreUseCase: asModuleClass(
        EnvoyerMailInscriptionInfolettreUseCase,
      ),
      recupererEtatModaleInscriptionUseCase: asModuleClass(
        RecupererEtatModaleInscriptionUseCase,
      ),
      desactiverPopupInfolettreUseCase: asModuleClass(
        DesactiverPopupInfolettreUseCase,
      ),
      ajouterUnContactAUneInfoLettreUseCase: asModuleClass(
        AjouterUnContactAUneInfoLettreUseCase,
      ),
      habilitationService: asModuleClass(PrismaHabilitationService),
      actionCompteInactifRepository: asModuleClass(
        PrismaActionCompteInactifRepository,
      ),
      creerLesActionsComptesInactifsUseCase: asModuleClass(
        CreerLesActionsComptesInactifsUseCase,
      ),
      envoyerLesRelancesUseCase: asModuleClass(EnvoyerLesRelancesUseCase),
      desactiverLesComptesInactifsUseCase: asModuleClass(
        DesactiverLesComptesInactifsUseCase,
      ),
      importerDesUtilisateursUseCase: asModuleClass(
        ImporterDesUtilisateursUseCase,
      ),
    } satisfies VerifyCradle<GestionUtilisateurCradle>);
  },
});

export type { GestionUtilisateurExports };
type Scope = ExtractScope<typeof gestionUtilisateurModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
