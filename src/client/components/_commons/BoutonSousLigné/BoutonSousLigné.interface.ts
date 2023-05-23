import { ButtonHTMLAttributes, ReactNode, MouseEventHandler } from 'react';

export default interface BoutonSousLignéProps {
  ariaControls?: string,
  children?: ReactNode,
  classNameSupplémentaires?: string,
  dataFrOpened?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>,
  type?: ButtonHTMLAttributes<never>['type'],
}
