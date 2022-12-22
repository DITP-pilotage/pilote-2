import { useCallback, useState } from 'react';
import SommaireBoutonDéplierProps from './SommaireBoutonDéplier.interface';
import styles from './SommaireBoutonDéplier.module.scss';

export default function SommaireBoutonDéplier({ clicSurLeBoutonDéplierCallback }: SommaireBoutonDéplierProps) {
  const [estDéplié, setEstDéplié] = useState(false);

  const changementDeLÉtatDuBouton = useCallback(() => {
    setEstDéplié(!estDéplié);
    clicSurLeBoutonDéplierCallback(); 
  }, [clicSurLeBoutonDéplierCallback, estDéplié]);

  return (
    <button
      className={`${styles.bouton} fr-ml-n4w fr-px-1v`}
      onClick={() => changementDeLÉtatDuBouton()}
      type='button'
    >
      <span
        aria-hidden="true"
        className={`${estDéplié ? styles.ouvert : styles.fermé} fr-icon-arrow-right-s-line`}
      />
    </button>
  );
}
