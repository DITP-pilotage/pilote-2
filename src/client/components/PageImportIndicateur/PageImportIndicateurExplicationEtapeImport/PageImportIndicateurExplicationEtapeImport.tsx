import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
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
      <div className="fr-container fr-pt-2w fr-pb-3w">
        <Titre baliseHtml="h2" className="fr-h4 text-primary">
          {
            wording.PAGE_IMPORT_MESURE_INDICATEUR
              .SECTION_EXPLICATION_ETAPE_IMPORT.TITRE
          }
        </Titre>
        <ol className="fr-grid-row fr-grid-row--gutters fr-m-0 fr-p-0">
          {explicationsEtapeImport.map(({ titre, texte }, index) => (
            <li
              className="fr-col-lg-4 min-[62rem]:first-of-type:pl-0 min-[62rem]:last-of-type:pr-0 marker:content-['']"
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
