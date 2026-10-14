import { FunctionComponent } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import { ChantierInformations } from "@/client/components/PageImportIndicateur/ChantierInformation.interface";

interface PageImportIndicateurEnTêteProps {
  chantierInformations: ChantierInformations;
  hrefBoutonRetour: string;
}

const PageImportIndicateurEnTête: FunctionComponent<
  PageImportIndicateurEnTêteProps
> = ({ chantierInformations, hrefBoutonRetour }) => {
  return (
    <header className="bg-dsfr-blue-france-925">
      <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] py-8">
        <FilAriane
          chemin={[{ nom: "Chantier", lien: hrefBoutonRetour }]}
          libelléPageCourante="Indicateurs"
        />
        <h1 className="text-h2 md:text-h2-md mt-4 mb-2">
          {chantierInformations.nom}
        </h1>
      </div>
    </header>
  );
};

export default PageImportIndicateurEnTête;
