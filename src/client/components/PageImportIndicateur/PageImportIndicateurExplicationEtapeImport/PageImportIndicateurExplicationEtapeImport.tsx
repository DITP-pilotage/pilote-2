import { useRouter } from 'next/router';
import Titre from '@/components/_commons/Titre/Titre';
import { wording } from '@/client/utils/i18n/i18n';
import ExplicationEtapeIndicateur from './ExplicationEtapeIndicateur/ExplicationEtapeIndicateur';
import PageImportIndicateurExplicationEtapeImportStyled from './PageImportIndicateurExplicationEtapeImport.styled';

interface ExplicationEtape {
  titre: string,
  texte: string
}

const explicationsEtapeImport: ExplicationEtape[] = [
  {
    titre: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.TITRE,
    texte: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_SELECTION_INDICATEUR.TEXTE,
  },
  {
    titre: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TITRE,
    texte: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_CHARGER_FICHIER.TEXTE,
  },
  {
    titre: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TITRE,
    texte: wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.ETAPE_PUBLIER_FICHIER.TEXTE,
  },
];

export default function PageImportIndicateurExplicationEtapeImport() {
  const { query } = useRouter();
  const etapeCourante = query.etapeCourante ? Number(query.etapeCourante) : 1;


  return (
    <PageImportIndicateurExplicationEtapeImportStyled>
      <div className='fr-container fr-pt-2w fr-pb-3w'>
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          {wording.PAGE_IMPORT_MESURE_INDICATEUR.SECTION_EXPLICATION_ETAPE_IMPORT.TITRE}
        </Titre>
        <ol className='fr-grid-row fr-grid-row--gutters fr-m-0 fr-p-0'>
          {explicationsEtapeImport.map(({ titre, texte }, index) => (
            <li
              className='fr-col-lg-4'
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
    </PageImportIndicateurExplicationEtapeImportStyled>
  );
}
