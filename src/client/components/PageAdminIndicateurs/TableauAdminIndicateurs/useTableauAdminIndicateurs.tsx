import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, ChangeEventHandler, FormEventHandler, useCallback, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import api from '@/server/infrastructure/api/trpc/api';
import {
  filtresModifierIndicateursActifsStore,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import { horodatage } from '@/client/utils/date/date';
import AlerteProps from '@/components/_commons/Alerte/Alerte.interface';

const reactTableColonnesHelper = createColumnHelper<MetadataParametrageIndicateurContrat>();
const colonnes = [
  reactTableColonnesHelper.accessor('indicParentCh', {
    header: 'Chantier associé',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('chantierNom', {
    header: 'Nom du chantier',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicId', {
    header: 'Identifiant indicateur',
    sortingFn: 'alphanumericCaseSensitive',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicNom', {
    header: 'Nom de l\'indicateur',
    sortingFn: 'auto',
    cell: props => props.getValue(),
  }),
  reactTableColonnesHelper.accessor('indicHiddenPilote', {
    header: 'Actif / Inactif',
    sortingFn: 'auto',
    cell: props => props.getValue() ? (
      <div className='flex justify-center'>
        <span
          aria-hidden='true'
          className='fr-icon-close-circle-fill fr-icon-red'
        />
      </div>
    ) : (
      <div className='flex justify-center'>
        <span
          aria-hidden='true'
          className='fr-icon-checkbox-circle-fill fr-icon-green'
        />
      </div>
    ),
  }),
];

export default function useTableauPageAdminIndicateurs() {
  const filtresActifs = filtresModifierIndicateursActifsStore();
  
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');


  const [file, setFile] = useState<File | null>(null);
  const [alerte, setAlerte] = useState <AlerteProps | null>(null);

  const { data: metadataIndicateurs = [], isLoading: estEnChargement } = api.metadataIndicateur.récupérerMetadataIndicateurFiltrés.useQuery({
    filtres: filtresActifs,
  });

  const exporterLesIndicateurs = () => {
    let queryParam = '';
    if (filtresActifs.chantiers.length > 0) {
      queryParam = '?' + filtresActifs.chantiers.map(chantier => (`chantierIds=${chantier}`)).join('&');
    }
    const url = `/api/export/metadata-indicateurs${queryParam}`;
    const a = window.document.createElement('a');
    a.href = url;
    a.target = '_self';
    a.download = `metadata-indicateurs-${horodatage()}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  };


  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const tableau = useReactTable({
    data : metadataIndicateurs,
    columns: colonnes,

    globalFilterFn: (ligne, colonneId, texteRecherché) => {
      const valeurCellule = ligne.getValue<ProjetStructurant>(colonneId);
      return valeurCellule !== null && rechercheUnTexteContenuDansUnContenant(texteRecherché, valeurCellule.toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDePageCallback = useCallback((numéroDePage: number) => (
    tableau.setPageIndex(numéroDePage - 1)
  ), [tableau]);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  type UploadFichierFormulaireElement = { 'file-upload': HTMLInputElement } & HTMLFormElement;

  const verifierLeFichier: FormEventHandler<UploadFichierFormulaireElement> = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    event.currentTarget['file-upload'].value = '';

    const body = new FormData();

    body.append('file', file);

    await fetch('/api/import/metadata-indicateurs', {
      method: 'POST',
      body,
    });

    setAlerte({
      type: 'succès',
      titre : 'Import de masse réussie',
    });
  };

  return {
    file,
    alerte,
    définirLeFichier,
    verifierLeFichier,
    tableau,
    estEnChargement,
    changementDePageCallback,
    valeurDeLaRecherche,
    exporterLesIndicateurs,
    changementDeLaRechercheCallback,
  };
}
