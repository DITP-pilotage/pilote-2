import { render, screen } from '@testing-library/react';
import PageImportIndicateur from '../../../../client/components/PageImportIndicateur/PageImportIndicateur';

describe('PageImportIndicateur', () => {
  it("doit afficher un titre indiquant que l'on est sur la page indicateur", () => {
    // WHEN
    render(<PageImportIndicateur />);

    // THEN
    const titre = screen.getByRole('heading', { level: 1 });

    expect(titre).toBeInTheDocument();
  });
});
