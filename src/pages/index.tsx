import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
}

export default function NextPageAccueil({ chantiers, ministères }: NextPageAccueilProps) {
  return (
    <PageChantiers
      chantiers={chantiers}
      ministères={ministères}
    />
  );
}

export async function getServerSideProps() {
  const périmètreRepository = dependencies.getPerimètreMinistérielRepository();
  const chantierRepository = dependencies.getChantierRepository();

  // TODO en attendant le branchement avec les vraies données
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantiers = await chantierRepository.getListe();

  const ministères = [{
    nom: 'Premier(ère) ministre',
    périmètresMinistériels: [
      { id: 'PER-019', nom: 'Premier Ministre (DIJOP, SGPI, CNR, SGPE)' },
      { id: 'PER-017', nom: 'Mer' },
      { id: 'PER-010', nom: 'Egalité Femmes-Hommes' },
      { id: 'PER-011', nom: 'Enfance' },
      { id: 'PER-007', nom: 'Economie Sociale et Solidaire, Vie Associative' },
      { id: 'PER-020', nom: 'Renouveau Démocratique' },
    ],
  }, {
    nom: 'Économie, des Finances et de la Souveraineté industrielle et numérique',
    périmètresMinistériels: [
      { id: 'PER-008', nom: 'Economie, Industrie, Numérique' },
      { id: 'PER-005', nom: 'Comptes publics' },
    ],
  }, {
    nom: 'Intérieur et des Outre-mer',
    périmètresMinistériels: [
      { id: 'PER-014', nom: 'Intérieur' },
      { id: 'PER-018', nom: 'Outre-Mer' },
    ],
  }, {
    nom: 'Europe et des Affaires étrangères',
    périmètresMinistériels: [
      { id: 'PER-013', nom: 'Europe et Affaires étrangères' },
    ],
  }, {
    nom: 'Justice',
    périmètresMinistériels: [
      { id: 'PER-015', nom: 'Justice' },
    ],
  }, {
    nom: 'Armées',
    périmètresMinistériels: [
      { id: 'PER-002', nom: 'Armées' },
    ],
  }, {
    nom: "Travail, du Plein emploi et de l'Insertion",
    périmètresMinistériels: [
      { id: 'PER-028', nom: 'Travail, Emploi et Insertion' },
    ],
  }, {
    nom: 'Éducation nationale et de la Jeunesse',
    périmètresMinistériels: [
      { id: 'PER-009', nom: 'Education nationale' },
    ],
  }, {
    nom: 'Enseignement supérieur et de la Recherche',
    périmètresMinistériels: [
      { id: 'PER-012', nom: 'Enseignement supérieur, Recherche' },
    ],
  }, {
    nom: 'Agriculture et de la Souveraineté alimentaire',
    périmètresMinistériels: [
      { id: 'PER-001', nom: 'Agriculture' },
    ],
  }, {
    nom: 'Transition écologique et de la Cohésion des territoires',
    périmètresMinistériels: [
      { id: 'PER-025', nom: 'Transition Ecologique' },
      { id: 'PER-004', nom: 'Cohésion des territoires, ville' },
      { id: 'PER-016', nom: 'Logement' },
      { id: 'PER-027', nom: 'Transports' },
    ],
  }, {
    nom: 'Transition énergétique',
    périmètresMinistériels: [
      { id: 'PER-026', nom: 'Transition Energétique' },
    ],
  }, {
    nom: 'Culture',
    périmètresMinistériels: [
      { id: 'PER-006', nom: 'Culture' },
    ],
  }, {
    nom: 'Santé et de la Prévention',
    périmètresMinistériels: [
      { id: 'PER-021', nom: 'Santé' },
    ],
  }, {
    nom: "Solidarités, de l'Autonomie et des Personnes handicapées",
    périmètresMinistériels: [
      { id: 'PER-022', nom: 'Solidarité' },
      { id: 'PER-003', nom: 'Autonomie, Handicap' },
    ],
  }, {
    nom: 'Transformation et de la Fonction publiques',
    périmètresMinistériels: [
      { id: 'PER-024', nom: 'Transformation et Fonction Publiques' },
    ],
  }, {
    nom: 'Sports et des Jeux olympiques et paralympiques',
    périmètresMinistériels: [
      { id: 'PER-023', nom: 'Sports et JOP 2024' },
    ],
  }];

  return {
    props: {
      chantiers,
      ministères,
    },
  };
}
