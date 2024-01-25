import { UseFormRegisterReturn } from 'react-hook-form';

export default interface InterrupteurProps {
  checked: boolean;
  id: string;
  auChangement?: (estCochée: boolean) => void;
  libellé: string;
  register?: UseFormRegisterReturn;
  messageSecondaire?: string;
}
