import { FunctionComponent } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { horodatage } from "@/client/utils/date/date";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";

export const ExportDesDonnees: FunctionComponent = () => {
  const [filtres] = useQueryStates(
    {
      territoires: parseAsString.withDefault(""),
      perimetresMinisteriels: parseAsString.withDefault(""),
      chantiers: parseAsString.withDefault(""),
      profils: parseAsString.withDefault(""),
      typeCompte: parseAsString.withDefault("actif,desactive"),
      q: parseAsString.withDefault(""),
    },
    {
      shallow: false,
      clearOnDefault: true,
      history: "push",
    },
  );

  const arrayOptionsExport: {
    name: string;
    value: string;
  }[] = [
    ...filtres.territoires
      .split(",")
      .filter(Boolean)
      .map((filtreTerritoire) => ({
        name: "territoires",
        value: filtreTerritoire,
      })),
    ...filtres.perimetresMinisteriels
      .split(",")
      .filter(Boolean)
      .map((filtrePerimetreMinisteriel) => ({
        name: "perimetresMinisteriels",
        value: filtrePerimetreMinisteriel,
      })),
    ...filtres.chantiers
      .split(",")
      .filter(Boolean)
      .map((filtreChantier) => ({
        name: "chantiers",
        value: filtreChantier,
      })),
    ...filtres.profils
      .split(",")
      .filter(Boolean)
      .map((filtreProfil) => ({
        name: "profils",
        value: filtreProfil,
      })),
    ...filtres.typeCompte
      .split(",")
      .filter(Boolean)
      .map((filtreTypeCompte) => ({
        name: "typeCompte",
        value: filtreTypeCompte,
      })),
  ];

  if (filtres.q) {
    arrayOptionsExport.push({ name: "queryString", value: filtres.q });
  }

  return (
    <form
      data-testid="form-export"
      onSubmit={(événement) => {
        événement.preventDefault();
        const url = "/api/export/utilisateurs";
        const baseDuNomDeFichier = "PILOTE-Utilisateurs";

        const a = window.document.createElement("a");
        const strOptionsExport = `${arrayOptionsExport.map((option) => `${option.name}=${option.value}`).join("&")}`;
        a.href = `${url}${strOptionsExport.length > 0 ? `?${strOptionsExport}` : ""}`;
        a.target = "_self";
        a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
        document.body.append(a);
        a.click();
        a.remove();
      }}
    >
      <div className="w-full flex justify-end align-center">
        <button
          className="!text-primary flex align-center gap-2 font-medium"
          type="submit"
        >
          <Icone className="w-4 h-4" icone={Download1Icon} />
          Exporter les données
        </button>
      </div>
    </form>
  );
};
