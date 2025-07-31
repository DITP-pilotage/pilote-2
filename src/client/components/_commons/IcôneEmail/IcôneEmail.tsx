import "material-symbols/index.css";
import "material-icons/iconfont/material-icons.css";
import { FunctionComponent } from "react";

interface IcôneEmailProps {
  className?: string;
}

const IcôneEmail: FunctionComponent<IcôneEmailProps> = ({ className }) => {
  return <span className={`material-icons-outlined ${className}`}>email</span>;
};

export default IcôneEmail;
