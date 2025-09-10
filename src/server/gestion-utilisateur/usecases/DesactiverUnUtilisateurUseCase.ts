import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { Utilisateur } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  chantierRepository: ChantierRepository;
  territoireRepository: TerritoireRepository;
  perimetreMinisterielRepository: PerimetreMinisterielRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  contactInfoLettresService: ContactInfoLettresService;
};

export default class DesactiverUnUtilisateurUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private territoireRepository: TerritoireRepository;

  private chantierRepository: ChantierRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    chantierRepository,
    territoireRepository,
    perimetreMinisterielRepository,
    utilisateurIAMRepository,
    tokenAPIInformationRepository,
    contactInfoLettresService,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(
    email: Utilisateur["email"],
    habilitations: Habilitations,
    profil: Profil | null,
    auteurId: string,
  ): Promise<void> {
    const listeInformationsChantiersUtilisateurs =
      await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes(
      [],
    );
    const listePerimetresMinisteriels =
      await this.perimetreMinisterielRepository.listerIds([]);

    const utilisateurASupprimer = await this.utilisateurRepository.récupérer(
      email,
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    );

    if (!utilisateurASupprimer) {
      throw new NotFoundError("Le compte à supprimer n'existe pas.");
    }

    const habilitationsUtilisateurASupprimer =
      utilisateurASupprimer.habilitations;
    const habilitation = new Habilitation(habilitations);
    habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
      habilitationsUtilisateurASupprimer.lecture.chantiers,
      habilitationsUtilisateurASupprimer.lecture.territoires,
      profil,
    );

    await this.utilisateurRepository.desactiver(email, auteurId);

    if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === "true") {
      await this.contactInfoLettresService.supprimerContact(email);
    }

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await this.utilisateurIAMRepository.desactive(email);
    }
    await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({
      email,
    });
  }
}
