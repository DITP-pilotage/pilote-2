import { render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import SélecteurPerimetre from "@/components/PageAdminChantiers/champs/SélecteurPerimetre";
import {
  ChantierForm,
  defaultChantierVide,
} from "@/components/PageAdminChantiers/useChantierForm";

const useQueryMock = vi.fn();

vi.mock("@/server/infrastructure/api/trpc/api", () => ({
  default: {
    metadataChantier: {
      listerPerimetres: {
        useQuery: (...args: unknown[]) => useQueryMock(...args),
      },
    },
  },
}));

const PERIMETRE_PARTAGÉ = { id: "PER-SHARED", nom: "Périmètre partagé" };
const PERIMETRES_MIN_A = [
  { id: "PER-A1", nom: "Périmètre A1" },
  PERIMETRE_PARTAGÉ,
];
const PERIMETRES_MIN_B = [
  { id: "PER-B1", nom: "Périmètre B1" },
  PERIMETRE_PARTAGÉ,
];

const Harness = ({
  defaultValues,
}: {
  defaultValues: Partial<ChantierForm>;
}) => {
  const methods = useForm<ChantierForm>({
    defaultValues: { ...defaultChantierVide("CH-001"), ...defaultValues },
  });
  return (
    <FormProvider {...methods}>
      <SélecteurPerimetre />
      <button
        onClick={() => methods.setValue("porteurIdPrincipal", "MIN-B")}
        type="button"
      >
        changer de porteur
      </button>
      <span data-testid="chPer">{methods.watch("chPer")}</span>
    </FormProvider>
  );
};

describe("SélecteurPerimetre", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockImplementation(({ porteurId }) => {
      if (porteurId === "MIN-A") {
        return { data: PERIMETRES_MIN_A, isSuccess: true };
      }
      if (porteurId === "MIN-B") {
        return { data: PERIMETRES_MIN_B, isSuccess: true };
      }
      return { data: undefined, isSuccess: false };
    });
  });

  it("désactive le sélecteur tant qu'aucun porteur principal n'est sélectionné", () => {
    // Given / When
    render(<Harness defaultValues={{ porteurIdPrincipal: "" }} />);

    // Then
    expect(screen.getByRole("combobox", { name: /périmètre/i })).toBeDisabled();
  });

  it("affiche les périmètres du porteur principal sélectionné", () => {
    // Given / When
    render(
      <Harness defaultValues={{ porteurIdPrincipal: "MIN-A", chPer: "" }} />,
    );

    // Then
    const sélecteur = screen.getByRole("combobox", { name: /périmètre/i });
    expect(sélecteur).toBeEnabled();
    expect(
      screen.getByRole("option", { name: "PER-A1 — Périmètre A1" }),
    ).toBeInTheDocument();
  });

  it("conserve le périmètre sélectionné s'il appartient toujours au nouveau porteur", async () => {
    // Given
    render(
      <Harness
        defaultValues={{ porteurIdPrincipal: "MIN-A", chPer: "PER-SHARED" }}
      />,
    );

    // When
    screen.getByRole("button", { name: "changer de porteur" }).click();

    // Then
    await waitFor(() =>
      expect(useQueryMock).toHaveBeenCalledWith(
        { porteurId: "MIN-B" },
        expect.anything(),
      ),
    );
    expect(screen.getByTestId("chPer")).toHaveTextContent("PER-SHARED");
  });

  it("vide le périmètre sélectionné s'il n'appartient plus au nouveau porteur", async () => {
    // Given
    render(
      <Harness
        defaultValues={{ porteurIdPrincipal: "MIN-A", chPer: "PER-A1" }}
      />,
    );

    // When
    screen.getByRole("button", { name: "changer de porteur" }).click();

    // Then
    await waitFor(() =>
      expect(screen.getByTestId("chPer")).toHaveTextContent(""),
    );
  });
});
