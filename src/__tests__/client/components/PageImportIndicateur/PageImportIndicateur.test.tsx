import { render, screen, within } from '@testing-library/react';
import PageImportIndicateur from '../../../../client/components/PageImportIndicateur/PageImportIndicateur';

describe('PageImportIndicateur', () => {
  it("doit afficher un titre indiquant que l'on est sur la page indicateur", () => {
    // WHEN
    render(
      <PageImportIndicateur chantierId="chantierId" />,
    );

    // THEN
    const titre = screen.getByRole('heading', { level: 1 });

    expect(titre).toBeInTheDocument();
    expect(titre).toHaveTextContent('Hello world');
  });

  it("doit afficher un fil d'Ariane indiquant l'indicateur, le chantier et le retour à l'accueil", () => {
    // WHEN
    render(
      <PageImportIndicateur chantierId="chantierId" />,
    );

    // THEN
    const fileDAriane = screen.getByRole('navigation');
    const elementAccueilFileDAriane = within(fileDAriane).getByRole('link', { name: 'Accueil' });
    const elementChantierFileDAriane = within(fileDAriane).getByRole('link', { name: 'Chantier' });

    expect(fileDAriane).toBeInTheDocument();
    expect(elementAccueilFileDAriane).toHaveAttribute('href', '/');
    expect(elementChantierFileDAriane).toHaveAttribute('href', '#');
    expect(fileDAriane).toHaveTextContent('Indicateurs');
  });

  it("doit afficher un champ d'import de fichier de type tableur", () => {
    // WHEN
    render(
      <PageImportIndicateur chantierId="chantierId" />,
    );

    // THEN
    const boutonImport = screen.getByLabelText('Importer des données');

    expect(boutonImport).toBeInTheDocument();
    expect(boutonImport).toHaveAttribute('type', 'file');
    expect(boutonImport).toHaveAttribute('accept', '.csv, .xls, .xlsx');
  });

  it('doit afficher un bouton de soumission du fichier', () => {
    // WHEN
    render(
      <PageImportIndicateur chantierId="chantierId" />,
    );

    // THEN
    const boutonSoumission = screen.getByRole('button', { name: 'Importer les données' });    

    expect(boutonSoumission).toBeInTheDocument();
  });
});
