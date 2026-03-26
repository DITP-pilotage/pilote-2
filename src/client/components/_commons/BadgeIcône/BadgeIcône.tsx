import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import { FunctionComponent } from "react";

interface BadgeIcôneProps {
  type: "warning";
}

const BadgeIcône: FunctionComponent<BadgeIcôneProps> = ({ type }) => {
  return <p className={`fr-badge fr-badge--${type} [&::before]:my-0 [&::before]:-mx-1`} />;
};

export default BadgeIcône;
