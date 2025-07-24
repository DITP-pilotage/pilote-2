import { mock, MockProxy } from 'jest-mock-extended';
import { PropositionValeurAvancementRepository, PropositionValeurAvancementRapport } from '@/server/chantiers/domain/ports/PropositionValeurAvancementRepository';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { EnvoieEmailService } from '@/server/chantiers/domain/ports/EnvoieEmailService';
import { EnvoyerLesRapportsPropositionValeurAvancementUseCase } from '@/server/chantiers/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase';
import { UtilisateurRepository } from '@/server/chantiers/domain/ports/UtilisateurRepository';
import { Utilisateur } from '@/server/chantiers/domain/Utilisateur';
import { PropositionValeurAvancementChantierInformation } from '@/server/chantiers/domain/PropositionValeurAvancementChantierInformation';
import { genererParametresEnvoieRapportProposition } from '@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition';

describe('EnvoyerLesRapportsPropositionValeurAvancementUseCase', () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let propositionValeurAvancementRepository: MockProxy<PropositionValeurAvancementRepository>;
  let chantierRepository: MockProxy<ChantierRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;

  let envoyerLesRapportsPropositionValeurAvancementUseCase: EnvoyerLesRapportsPropositionValeurAvancementUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    propositionValeurAvancementRepository = mock<PropositionValeurAvancementRepository>();
    chantierRepository = mock<ChantierRepository>();
    envoieEmailService = mock<EnvoieEmailService>();

    envoyerLesRapportsPropositionValeurAvancementUseCase = new EnvoyerLesRapportsPropositionValeurAvancementUseCase({ propositionValeurAvancementRepository, chantierRepository, utilisateurRepository, envoieEmailService });
  });
  it('Supprime les comptes qui sont désactivés depuis plus de 2 ans et anonymise les saisies', async () => {
    // Given
    const listeChantiersIdsAvecProposition = ['CH-001', 'CH-002', 'CH-003'];
    const listeDirecteursDeProjet: Utilisateur[] = [
      Utilisateur.creerUtilisateur({ email: 'directeur.test1@exemple.com', nom: 'test1', prenom: 'directeur', listeChantiers: ['CH-001'] }),
      Utilisateur.creerUtilisateur({ email: 'directeur.test2@exemple.com', nom: 'test2', prenom: 'directeur', listeChantiers: ['CH-002'] }),
      Utilisateur.creerUtilisateur({ email: 'directeur.test3@exemple.com', nom: 'test3', prenom: 'directeur', listeChantiers: ['CH-001', 'CH-003'] }),
    ];
    const listeChantiersProposition: PropositionValeurAvancementChantierInformation[] = [
      {
        id: 'CH-001',
        nom: 'Chantier 1',
        statut: 'PUBLIE',
        conseillerMail: 'conseiller.ch1@exemple.com',
      },
      {
        id: 'CH-002',
        nom: 'Chantier 2',
        statut: 'PUBLIE',
        conseillerMail: 'conseiller.ch2@exemple.com',
      },
      {
        id: 'CH-003',
        nom: 'Chantier 3',
        statut: 'PUBLIE',
        conseillerMail: 'conseiller.ch3@exemple.com',
      },
    ];
    const mapChantiersPropositionInformation = new Map(listeChantiersProposition.map(chantier => [chantier.id, chantier]));

    const propositionsParChantier: Map<string, Map<string, PropositionValeurAvancementRapport[]>> = new Map([
      ['CH-001', new Map([
        ['IND-001', [
          {
            indicateurId: 'IND-001',
            territoireCode: 'DEPT-01',
            dateValeurAvancement: '2025-05-15',
            valeurAvancementProposee: '75',
            valeurAvancementReference: '70',
            nomIndicateur: 'Indicateur 1',
            uniteIndicateur: '%',
            nomTerritoire: 'Ain',
          },
          {
            indicateurId: 'IND-001',
            territoireCode: 'DEPT-02',
            dateValeurAvancement: '2025-05-15',
            valeurAvancementProposee: '60',
            valeurAvancementReference: '55',
            nomIndicateur: 'Indicateur 1',
            uniteIndicateur: '%',
            nomTerritoire: 'Aisne',
          },
        ]],
        ['IND-002', [
          {
            indicateurId: 'IND-002',
            territoireCode: 'DEPT-01',
            dateValeurAvancement: '2025-05-15',
            valeurAvancementProposee: '150',
            valeurAvancementReference: '145',
            nomIndicateur: 'Indicateur 2',
            uniteIndicateur: '',
            nomTerritoire: 'Ain',
          },
        ]],
      ])],
      ['CH-002', new Map([
        ['IND-003', [
          {
            indicateurId: 'IND-003',
            territoireCode: 'DEPT-75',
            dateValeurAvancement: '2025-05-10',
            valeurAvancementProposee: '90',
            valeurAvancementReference: '85',
            nomIndicateur: 'Indicateur 3',
            uniteIndicateur: '',
            nomTerritoire: 'Paris',
          },
        ]],
      ])],
      ['CH-003', new Map([
        ['IND-004', [
          {
            indicateurId: 'IND-004',
            territoireCode: 'DEPT-75',
            dateValeurAvancement: '2025-05-10',
            valeurAvancementProposee: '90',
            valeurAvancementReference: '85',
            nomIndicateur: 'Indicateur 4',
            uniteIndicateur: '',
            nomTerritoire: 'Paris',
          },
        ]],
      ])],
    ]);    
    
    const paramsDirecteur1 = genererParametresEnvoieRapportProposition(listeDirecteursDeProjet[0].listeChantiers, mapChantiersPropositionInformation, propositionsParChantier);
    const paramsDirecteur2 = genererParametresEnvoieRapportProposition(listeDirecteursDeProjet[1].listeChantiers, mapChantiersPropositionInformation, propositionsParChantier);
    const paramsDirecteur3 = genererParametresEnvoieRapportProposition(listeDirecteursDeProjet[2].listeChantiers, mapChantiersPropositionInformation, propositionsParChantier);

    propositionValeurAvancementRepository.recupererLaListeDesChantiersIdsAvecPropositionEnCours.mockResolvedValue(listeChantiersIdsAvecProposition);
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(listeDirecteursDeProjet);
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(listeChantiersProposition);
    propositionValeurAvancementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(propositionsParChantier);
    // When
    await envoyerLesRapportsPropositionValeurAvancementUseCase.run();

    // Then
    expect(propositionValeurAvancementRepository.recupererLaListeDesChantiersIdsAvecPropositionEnCours).toHaveBeenCalledTimes(1);
    expect(utilisateurRepository.recupererUtilisateursParProfilEtChantierIds).toHaveBeenCalledTimes(1);
    expect(chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds).toHaveBeenCalledTimes(1);
    expect(propositionValeurAvancementRepository.recupererLesPropositionsEnCoursParChantierIds).toHaveBeenCalledTimes(1);
    expect(envoieEmailService.envoieUnEmail).toHaveBeenCalledTimes(3);
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(1, [{ email: listeDirecteursDeProjet[0].email }], 4, { chantiers : paramsDirecteur1.chantiers, conseiller_email: paramsDirecteur1.conseillerEmail });
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(2, [{ email: listeDirecteursDeProjet[1].email }], 4, { chantiers : paramsDirecteur2.chantiers, conseiller_email: paramsDirecteur2.conseillerEmail });
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(3, [{ email: listeDirecteursDeProjet[2].email }], 4, { chantiers : paramsDirecteur3.chantiers, conseiller_email: paramsDirecteur3.conseillerEmail });
  });
});

