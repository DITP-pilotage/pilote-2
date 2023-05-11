import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';

export default function usePageProjetsStructurants() {
  const { récupérerNombreFiltresActifs } = actionsFiltresStore();

  return { nombreFiltresActifs: récupérerNombreFiltresActifs() };
}
