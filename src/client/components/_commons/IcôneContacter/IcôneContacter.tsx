import 'material-symbols/index.css';
import 'material-icons/iconfont/material-icons.css';
import { FunctionComponent } from 'react';

interface IcôneContacterProps {
  className?: string
}

const IcôneContacter: FunctionComponent<IcôneContacterProps> = ({ className }) => {
  return (
    <span className={`material-icons-outlined ${className}`}>
      email
    </span>
  );
};

export default IcôneContacter;
