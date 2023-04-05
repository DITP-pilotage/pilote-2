import { render, screen, within } from '@testing-library/react';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';

const CHANTIER_NOM = 'Offrir à chaque enfant une éducation culturelle et artistique';
const CHANTIER_AXE = 'Ceci est un axe';
const CHANTIER_PPG = 'Ceci est un ppg';

jest.mock('@/components/_commons/Cartographie/Cartographie.tsx', () => function Cartographie() {
  return (
    <span>
      Carto
    </span>
  );
});
// eslint-disable-next-line react/no-multi-comp
jest.mock('@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution.tsx', () => function IndicateurChart() {
  return (
    <span>
      Indicateur Chart
    </span>
  );
});

describe('PageImportIndicateur', () => {
  describe('En tête', () => {
    it("doit afficher un titre indiquant que l'on est sur la page indicateur", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const titre = screen.getByRole('heading', { level: 1 });

      expect(titre).toBeInTheDocument();
      expect(titre).toHaveTextContent(CHANTIER_NOM);
    });

    it("doit afficher l'axe et le ppg du chantier", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const chantierAxe = screen.getByText(CHANTIER_AXE);
      const chantierPPG = screen.getByText(CHANTIER_PPG);

      expect(chantierAxe).toBeInTheDocument();
      expect(chantierPPG).toBeInTheDocument();
    });

    it("doit afficher un fil d'Ariane indiquant l'indicateur, le chantier et le retour à l'accueil", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const fileDAriane = screen.getByRole('navigation');
      const elementAccueilFileDAriane = within(fileDAriane).getByRole('link', { name: 'Accueil' });
      const elementChantierFileDAriane = within(fileDAriane).getByRole('link', { name: 'Chantier' });

      expect(fileDAriane).toBeInTheDocument();
      expect(elementAccueilFileDAriane).toHaveAttribute('href', '/');
      expect(elementChantierFileDAriane).toHaveAttribute('href', '/chantier/chantierId');
      expect(fileDAriane).toHaveTextContent('Indicateurs');
    });
  });

  describe('Section import fichier indicateur pour un chantier', () => {
    it('doit afficher le titre de la section', () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const titreDeLaSection = screen.getByRole('heading', { level: 2 });

      expect(titreDeLaSection).toBeInTheDocument();
      expect(titreDeLaSection).toHaveTextContent('Indicateurs');
    });

    it("doit afficher la catégorie d'un indicateur", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const titreCatégorieIndicateur = screen.getByRole('heading', { level: 3 });

      expect(titreCatégorieIndicateur).toBeInTheDocument();
      expect(titreCatégorieIndicateur).toHaveTextContent("Indicateurs d'impact");
    });

    it('doit afficher la liste des titres des indicateurs', async () => {
      // GIVEN
      const indicateurs: Indicateur[] = [
        new IndicateurBuilder().avecType('IMPACT').avecNom('IND-CH-123 nom indicateur').build(),
        new IndicateurBuilder().avecType('CONTEXTE').avecNom('IND-CH-124 nom indicateur 2').build(),
      ];

      const détailsIndicateurs: DétailsIndicateurs = {};

      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      await render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={détailsIndicateurs}
          indicateurs={indicateurs}
        />,
      );

      // THEN
      const titreCatégorieIndicateur1 = await screen.getByText('IND-CH-123 nom indicateur');
      const titreCatégorieIndicateur2 = await screen.getByText('IND-CH-124 nom indicateur 2');

      expect(titreCatégorieIndicateur1).toBeInTheDocument();
      expect(titreCatégorieIndicateur2).toBeInTheDocument();
    });

    it.todo("quand on a aucun indicateur, doit afficher un bloc indiquant qu'il ny a pas d'indicateur");

    describe("doit afficher les détails de l'indicateur", () => {
      it.todo('doit afficher sa description, son mode de calcul et sa source');
    });

    it("doit afficher un champ d'import de fichier de type tableur", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const boutonImport = screen.getByLabelText('Importer des données');

      expect(boutonImport).toBeInTheDocument();
      expect(boutonImport).toHaveAttribute('type', 'file');
      expect(boutonImport).toHaveAttribute('accept', '.csv, .xls, .xlsx');
    });

    it('doit afficher un bouton de soumission du fichier', () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur
          chantierInformation={chantierInformation}
          détailsIndicateurs={null}
          indicateurs={[]}
        />,
      );

      // THEN
      const boutonSoumission = screen.getByRole('button', { name: 'Importer les données' });

      expect(boutonSoumission).toBeInTheDocument();
    });
  });
});
