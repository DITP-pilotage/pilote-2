import { render, screen, within } from '@testing-library/react';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';


const CHANTIER_NOM = 'Offrir à chaque enfant une éducation culturelle et artistique';
const CHANTIER_AXE = 'Ceci est un axe';
const CHANTIER_PPG = 'Ceci est un ppg';

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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
      );

      // THEN
      const titreCatégorieIndicateur = screen.getByRole('heading', { level: 3 });

      expect(titreCatégorieIndicateur).toBeInTheDocument();
      expect(titreCatégorieIndicateur).toHaveTextContent("Indicateurs d'impact");
    });

    it("doit afficher le titre d'un indicateur", () => {
      // GIVEN
      const chantierInformation: ChantierInformation = {
        id: 'chantierId',
        nom: CHANTIER_NOM,
        axe: CHANTIER_AXE,
        ppg: CHANTIER_PPG,
      };

      // WHEN
      render(
        <PageImportIndicateur chantierInformation={chantierInformation} />,
      );

      // THEN
      const titreCatégorieIndicateur = screen.getByText("Titre de l'indicateur");

      expect(titreCatégorieIndicateur).toBeInTheDocument();
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
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
        <PageImportIndicateur chantierInformation={chantierInformation} />,
      );

      // THEN
      const boutonSoumission = screen.getByRole('button', { name: 'Importer les données' });

      expect(boutonSoumission).toBeInTheDocument();
    });
  });
});
