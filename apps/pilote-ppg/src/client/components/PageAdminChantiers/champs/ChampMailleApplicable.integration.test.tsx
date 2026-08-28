import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import ChampMailleApplicable from "@/components/PageAdminChantiers/champs/ChampMailleApplicable";
import {
  ChantierForm,
  defaultChantierVide,
} from "@/components/PageAdminChantiers/useChantierForm";

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
      <ChampMailleApplicable />
      <button
        onClick={() =>
          methods.setValue("chTerrito", !methods.getValues("chTerrito"))
        }
        type="button"
      >
        basculer territorialisation
      </button>
      <span data-testid="mailleApplicable">
        {methods.watch("mailleApplicable").join(",")}
      </span>
    </FormProvider>
  );
};

describe("ChampMailleApplicable", () => {
  it("force NAT seule et désactive les mailles quand territorialisé est désactivé", async () => {
    // Given / When
    render(
      <Harness
        defaultValues={{
          chTerrito: false,
          mailleApplicable: ["NAT", "REG", "DEPT"],
        }}
      />,
    );

    // Then
    await waitFor(() =>
      expect(screen.getByTestId("mailleApplicable")).toHaveTextContent(
        "NAT",
      ),
    );
    expect(screen.getByRole("checkbox", { name: "NAT" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "NAT" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "REG" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "REG" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "DEPT" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "DEPT" })).toBeDisabled();
  });

  it("coche et désactive NAT et REG, laisse DEPT décochée mais modifiable quand territorialisé est activé", async () => {
    // Given / When
    render(
      <Harness defaultValues={{ chTerrito: true, mailleApplicable: ["NAT"] }} />,
    );

    // Then
    await waitFor(() =>
      expect(screen.getByTestId("mailleApplicable")).toHaveTextContent(
        "NAT,REG",
      ),
    );
    expect(screen.getByRole("checkbox", { name: "NAT" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "REG" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "REG" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "DEPT" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "DEPT" })).toBeEnabled();
  });

  it("permet de cocher DEPT quand territorialisé est activé", async () => {
    // Given
    render(
      <Harness
        defaultValues={{ chTerrito: true, mailleApplicable: ["NAT", "REG"] }}
      />,
    );

    // When
    await userEvent.click(screen.getByRole("checkbox", { name: "DEPT" }));

    // Then
    await waitFor(() =>
      expect(screen.getByTestId("mailleApplicable")).toHaveTextContent(
        "NAT,REG,DEPT",
      ),
    );
  });

  it("réinitialise à NAT uniquement quand on désactive la territorialisation après avoir coché DEPT", async () => {
    // Given
    render(
      <Harness
        defaultValues={{
          chTerrito: true,
          mailleApplicable: ["NAT", "REG", "DEPT"],
        }}
      />,
    );

    // When
    await userEvent.click(
      screen.getByRole("button", { name: "basculer territorialisation" }),
    );

    // Then
    await waitFor(() =>
      expect(screen.getByTestId("mailleApplicable")).toHaveTextContent(
        "NAT",
      ),
    );
  });

  it("ne propose plus les boutons tout sélectionner / tout désélectionner", () => {
    // Given / When
    render(
      <Harness
        defaultValues={{ chTerrito: true, mailleApplicable: ["NAT", "REG"] }}
      />,
    );

    // Then
    expect(
      screen.queryByRole("button", { name: /tout sélectionner/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tout désélectionner/i }),
    ).not.toBeInTheDocument();
  });
});
