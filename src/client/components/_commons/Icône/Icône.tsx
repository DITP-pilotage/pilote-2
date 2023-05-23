import '@gouvfr/dsfr/dist/utility/icons/icons-buildings/icons-buildings.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-communication/icons-communication.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-development/icons-development.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-finance/icons-finance.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-logo/icons-logo.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-media/icons-media.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-weather/icons-weather.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-editor/icons-editor.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-health/icons-health.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-others/icons-others.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css';
import 'material-icons/iconfont/material-icons.css';
import 'remixicon/fonts/remixicon.css';
import { useMemo } from 'react';
import IcôneProps from '@/components/_commons/Icône/Icône.interface';
import IcôneStyled from '@/components/_commons/Icône/Icône.styled';

const VARIANTES_MATERIAL_DESIGN = new Set(['outlined', 'round', 'sharp', 'two-tone']);

export default function Icône({ id }: IcôneProps) {
  const icône = useMemo(() => id.split('::'), [id]);
  if (icône === null) {
    return null;
  }

  const [bibliothèqueDIcônes, identifiantIcône, varianteExplicite] = icône;

  if (bibliothèqueDIcônes === 'dsfr') {
    return (
      <IcôneStyled className={`fr-icon-${identifiantIcône}`} />
    );
  }

  if (bibliothèqueDIcônes === 'google') {
    const variante = VARIANTES_MATERIAL_DESIGN.has(varianteExplicite) ? varianteExplicite : null;
    return (
      <IcôneStyled
        className={`material-icons${variante ? '-' + variante : ''}`}
      >
        { identifiantIcône }
      </IcôneStyled>
    );
  }

  if (bibliothèqueDIcônes === 'remix') {
    return (
      <IcôneStyled className={`ri-${identifiantIcône}`} />
    );
  }

  return null;
}
