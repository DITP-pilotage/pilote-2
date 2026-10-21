import { FunctionComponent } from "react";
import { useAdminUtilisateursSearchParams } from "@/components/PageAdminUtilisateurs/useAdminUtilisateursSearchParams";
import { horodatage } from "@/client/utils/date/date";
import { Icone } from "@/components/_commons/Icone";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";

export const ExportDesDonnees: FunctionComponent = () => {
  const { params } = useAdminUtilisateursSearchParams();

  const exportParams = new URLSearchParams([
    ...params.territoires.map((value) => ["territoires", value]),
    ...params.perimetresMinisteriels.map((value) => [
      "perimetresMinisteriels",
      value,
    ]),
    ...params.chantiers.map((value) => ["chantiers", value]),
    ...params.profils.map((value) => ["profils", value]),
    ...params.typeCompte.map((value) => ["typeCompte", value]),
    ...(params.q ? [["queryString", params.q]] : []),
  ]).toString();

  return (
    <form
      data-testid="form-export"
      onSubmit={(événement) => {
        événement.preventDefault();
        const url = "/api/export/utilisateurs";
        const baseDuNomDeFichier = "PILOTE-Utilisateurs";

        const a = window.document.createElement("a");
        a.href = `${url}${exportParams ? `?${exportParams}` : ""}`;
        a.target = "_self";
        a.download = `${baseDuNomDeFichier}-${horodatage()}.csv`;
        document.body.append(a);
        a.click();
        a.remove();
      }}
    >
      <div className="w-full flex justify-end items-center">
        <button
          className="text-primary flex items-center gap-2 font-medium"
          type="submit"
        >
          <Icone className="w-4 h-4" icone={Download1Icon} />
          Exporter les données
        </button>
      </div>
    </form>
  );
};
