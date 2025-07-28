import { calculerNouvelleMaille } from '@/components/PageAccueil/Filtres/utils';

describe('#calculerNouvelleMaille', () => {
  it('nouveau filtre: "nationale" ', () => {
    expect(calculerNouvelleMaille(['nationale'])).toBe('departementale');
  });

  it('nouveau filtre: "nationale, regionale" ', () => {
    expect(calculerNouvelleMaille(['nationale', 'regionale'])).toBe('regionale');
  });

  it('nouveau filtre: "nationale, departementale" ', () => {
    expect(calculerNouvelleMaille(['nationale', 'departementale'])).toBe('departementale');
  });

  it('nouveau filtre: "nationale, regionale, departementale" ', () => {
    expect(calculerNouvelleMaille(['nationale', 'regionale', 'departementale'])).toBe('departementale');
  });

  it('nouveau filtre: "regionale" ', () => {
    expect(calculerNouvelleMaille(['regionale'])).toBe('regionale');
  });

  it('nouveau filtre: "regionale, departementale" ', () => {
    expect(calculerNouvelleMaille(['regionale', 'departementale'])).toBe('departementale');
  });

  it('nouveau filtre: "departementale" ', () => {
    expect(calculerNouvelleMaille(['departementale'])).toBe('departementale');
  });
});
