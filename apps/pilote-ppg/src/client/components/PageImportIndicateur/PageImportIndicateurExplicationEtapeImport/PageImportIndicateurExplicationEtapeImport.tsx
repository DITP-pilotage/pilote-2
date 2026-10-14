import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { wording } from "@/client/utils/i18n/i18n";
import ExplicationEtapeIndicateur from "./ExplicationEtapeIndicateur/ExplicationEtapeIndicateur";

interface ExplicationEtape {
  titre: string;
  texte: string;
}

const explicationsEtapeImport: ExplicationEtape[] = [
  {
    titre:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_SELECTION_INDICATEUR.TITRE,
    texte:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_SELECTION_INDICATEUR.TEXTE,
  },
  {
    titre:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_CHARGER_FICHIER.TITRE,
    texte:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_CHARGER_FICHIER.TEXTE,
  },
  {
    titre:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_PUBLIER_FICHIER.TITRE,
    texte:
      wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT
        .ETAPE_PUBLIER_FICHIER.TEXTE,
  },
];

const PageImportIndicateurExplicationEtapeImport: FunctionComponent = () => {
  const { query } = useRouter();
  const etapeCourante = query.etapeCourante ? Number(query.etapeCourante) : 1;

  return (
    <section className="bg-dsfr-grey-1000">
      <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pt-4 pb-6">
        <h2 className="text-h4 md:text-h4-md text-primary">
          {
            wording.PAGE_IMPORT_MESURE_INDICATEUR
              .SECTION_EXPLICATION_ETAPE_IMPORT.TITRE
          }
        </h2>
        <ol className="flex flex-wrap m-0 p-0 list-none">
          {explicationsEtapeImport.map(({ titre, texte }, index) => (
            <li
              className="p-2 lg:p-3 lg:w-1/3 lg:shrink-0 min-[62rem]:first-of-type:pl-0 min-[62rem]:last-of-type:pr-0 marker:content-['']"
              key={titre}
            >
              <ExplicationEtapeIndicateur
                etapeCourante={etapeCourante}
                numéro={index + 1}
                texte={texte}
                titre={titre}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default PageImportIndicateurExplicationEtapeImport;
