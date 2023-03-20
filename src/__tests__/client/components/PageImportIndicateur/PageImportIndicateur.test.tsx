import { render, screen, within } from '@testing-library/react';
import PageImportIndicateur from '../../../../client/components/PageImportIndicateur/PageImportIndicateur';

describe('PageImportIndicateur', () => {
  it("doit afficher un titre indiquant que l'on est sur la page indicateur", () => {
    // WHEN
    render(
      <PageImportIndicateur
        chantierId="chantierId"
        indicateurId="indicateurId"
      />,
    );

    // THEN
    const titre = screen.getByRole('heading', { level: 1 });

    expect(titre).toBeInTheDocument();
    expect(titre).toHaveTextContent('Hello world');
  });

  it("doit afficher un fil d'Ariane indiquant l'indicateur, le chantier et le retour à l'accueil", () => {
    // WHEN
    render(
      <PageImportIndicateur
        chantierId="chantierId"
        indicateurId="indicateurId 1"
      />,
    );

    // THEN
    const fileDAriane = screen.getByRole('navigation');
    const elementAccueilFileDAriane = within(fileDAriane).getByRole('link', { name: 'Accueil' });
    const elementChantierFileDAriane = within(fileDAriane).getByRole('link', { name: 'Chantier' });

    expect(fileDAriane).toBeInTheDocument();
    expect(elementAccueilFileDAriane).toHaveAttribute('href', '/');
    expect(elementChantierFileDAriane).toHaveAttribute('href', '#');
    expect(fileDAriane).toHaveTextContent('Indicateur indicateurId 1');
  });
});
