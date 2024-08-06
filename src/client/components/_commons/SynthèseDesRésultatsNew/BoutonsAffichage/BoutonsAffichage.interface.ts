import { MouseEventHandler } from 'react';

export default interface BoutonsAffichageProps {
  afficherVoirPlus: boolean
  afficherVoirMoins: boolean
  déplierLeContenu: MouseEventHandler<HTMLButtonElement>
  replierLeContenu: MouseEventHandler<HTMLButtonElement>
}
