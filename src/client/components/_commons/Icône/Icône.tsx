import 'material-icons/iconfont/material-icons.css';
import 'remixicon/fonts/remixicon.css';
import { useMemo } from 'react';
import IcôneProps from '@/components/_commons/Icône/Icône.interface';
import IcôneStyled from '@/components/_commons/Icône/Icône.styled';

export default function Icône({ id }: IcôneProps) {
  const icône = useMemo(() => id.split('::'), [id]);
  if (icône === null) {
    return null;
  }

  const [bibliothèqueDIcônes, identifiantIcône] = icône;

  if (bibliothèqueDIcônes === 'google') {
    return (
      <IcôneStyled className="fr-mr-1w material-icons-outlined">
        { identifiantIcône }
      </IcôneStyled>
    );
  }

  if (bibliothèqueDIcônes === 'remix') {
    return (
      <IcôneStyled className={`fr-mr-1w ri-${identifiantIcône}`} />
    );
  }

  return null;
}
