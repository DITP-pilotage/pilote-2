import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import FicheChantier from "@/components/PageAdminChantiers/FicheChantier";
import {
  ChantierForm,
  defaultChantierVide,
} from "@/components/PageAdminChantiers/useChantierForm";

vi.mock(
  "@/components/PageAdminChantiers/champs/SélecteurPpg",
  () =>
    function SélecteurPpg() {
      return <span>SélecteurPpg</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/SélecteurPerimetre",
  () =>
    function SélecteurPerimetre() {
      return <span>SélecteurPerimetre</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/SélecteurZonegroup",
  () =>
    function SélecteurZonegroup() {
      return <span>SélecteurZonegroup</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/SélecteurPorteurPrincipal",
  () =>
    function SélecteurPorteurPrincipal() {
      return <span>SélecteurPorteurPrincipal</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/MultiSelectPorteursSecondaires",
  () =>
    function MultiSelectPorteursSecondaires() {
      return <span>MultiSelectPorteursSecondaires</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/MultiSelectPorteursDAC",
  () =>
    function MultiSelectPorteursDAC() {
      return <span>MultiSelectPorteursDAC</span>;
    },
);
vi.mock(
  "@/components/PageAdminChantiers/champs/ChampMailleApplicable",
  () =>
    function ChampMailleApplicable() {
      return <span>ChampMailleApplicable</span>;
    },
);

const Harness = () => {
  const methods = useForm<ChantierForm>({
    defaultValues: defaultChantierVide("CH-001"),
  });
  return (
    <FormProvider {...methods}>
      <FicheChantier />
    </FormProvider>
  );
};

describe("FicheChantier", () => {
  it("affiche la section Porteurs avant la section Rattachements", () => {
    // Given / When
    render(<Harness />);

    // Then
    const titres = screen
      .getAllByRole("heading", { level: 2 })
      .map((titre) => titre.textContent);
    const indexPorteurs = titres.indexOf("Porteurs");
    const indexRattachements = titres.indexOf("Rattachements");

    expect(indexPorteurs).toBeGreaterThanOrEqual(0);
    expect(indexRattachements).toBeGreaterThanOrEqual(0);
    expect(indexPorteurs).toBeLessThan(indexRattachements);
  });
});
