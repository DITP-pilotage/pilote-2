import { FiltresModifierIndicateursActifs } from '@/client/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class FiltrerListeMetadataIndicateurUseCase {
  constructor(
    private readonly metadataIndicateurs: MetadataParametrageIndicateur[],
    private readonly filtresActifs: FiltresModifierIndicateursActifs,
    private readonly chantier: Chantier,
  ) {}
}

