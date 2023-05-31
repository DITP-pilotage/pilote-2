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
import 'material-symbols/index.css';
import 'material-icons/iconfont/material-icons.css';
import 'remixicon/fonts/remixicon.css';
import { useMemo } from 'react';
import IcôneProps from '@/components/_commons/Icône/Icône.interface';
import IcôneStyled from '@/components/_commons/Icône/Icône.styled';

const MATERIAL_SYMBOLS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE: Record<string, string> = {
  'outlined': 'material-symbols-outlined',
  'rounded': 'material-symbols-rounded',
  'sharp': 'material-symbols-sharp',
};

const MATERIAL_ICONS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE: Record<string, string> = {
  'filled': 'material-icons',
  'outlined': 'material-icons-outlined',
  'rounded': 'material-icons-round',
  'sharp': 'material-icons-sharp',
  'two-tone': 'material-icons-two-tone',
};

const DSFR_ICONS_VARIANTES = new Set(['fill', 'line']);
const REMIX_ICONS_VARIANTES = new Set(['fill', 'line']);

export default function Icône({ id }: IcôneProps) {
  const identifiantIcône = useMemo(() => id.split('::'), [id]);
  if (identifiantIcône === null) {
    return null;
  }

  const [bibliothèqueDIcônes, nomIcône, varianteExplicite] = identifiantIcône;

  if (bibliothèqueDIcônes === 'dsfr') {
    const variante = DSFR_ICONS_VARIANTES.has(varianteExplicite) ? varianteExplicite : 'fill';
    return (
      <IcôneStyled className={`fr-icon-${nomIcône}-${variante}`} />
    );
  }

  if (bibliothèqueDIcônes === 'material-symbols') {
    const variante = MATERIAL_SYMBOLS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE[varianteExplicite]
      ?? MATERIAL_SYMBOLS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE.outlined;

    return (
      <IcôneStyled
        className={variante}
      >
        { nomIcône }
      </IcôneStyled>
    );
  }

  if (bibliothèqueDIcônes === 'material-icons') {
    const variante = MATERIAL_ICONS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE[varianteExplicite]
      ?? MATERIAL_ICONS_CLASSES_CSS_À_PARTIR_DE_LA_VARIANTE.filled;

    return (
      <IcôneStyled
        className={variante}
      >
        { nomIcône }
      </IcôneStyled>
    );
  }

  if (bibliothèqueDIcônes === 'remix') {
    const variante = REMIX_ICONS_VARIANTES.has(varianteExplicite) ? varianteExplicite : 'fill';
    return (
      <IcôneStyled className={`ri-${nomIcône}-${variante}`} />
    );
  }

  return null;
}
