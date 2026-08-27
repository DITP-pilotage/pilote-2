import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { ZonegroupAdminListItem } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";
import { ZonegroupValuesPreview } from "./ZonegroupValuesPreview";

const zonegroupActif: ZonegroupAdminListItem = {
  zoneGroupId: "ZG-001",
  zgName: "Groupement 1",
  nbZones: 2,
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const zonegroupArchivé: ZonegroupAdminListItem = {
  zoneGroupId: "ZG-002",
  zgName: "Groupement archivé",
  nbZones: 1,
  updatedAt: new Date().toISOString(),
  deletedAt: new Date().toISOString(),
};

describe("ZonegroupValuesPreview", () => {
  test("affiche les zone-groupes actifs", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupActif]} />);
    expect(screen.getByText("Groupement 1")).toBeInTheDocument();
  });

  test("n'affiche pas les zone-groupes archivés", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupArchivé]} />);
    expect(screen.queryByText("Groupement archivé")).not.toBeInTheDocument();
  });

  test("affiche un message quand aucun zone-groupe actif n'existe", () => {
    render(<ZonegroupValuesPreview zonegroups={[]} />);
    expect(
      screen.getByText("Aucun zone-groupe actif pour le moment."),
    ).toBeInTheDocument();
  });

  test("affiche un lien vers le référentiel des zone-groupes", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupActif]} />);
    const lien = screen.getByRole("link", {
      name: "Gérer les zone-groupes →",
    });
    expect(lien).toHaveAttribute(
      "href",
      "/panel-administrateur/referentiels/zonegroups",
    );
  });
});
