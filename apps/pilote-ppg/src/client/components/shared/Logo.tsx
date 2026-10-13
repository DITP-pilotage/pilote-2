import { clsxm } from "@/utils/clsxm";
import "./Logo.css";

type LogoProps = {
  variant?: "footer";
  className?: string;
};

export const Logo = ({ variant, className }: LogoProps) => (
  <p
    className={clsxm(
      "marianne-logo",
      variant === "footer" && "marianne-logo--footer",
      className,
    )}
  >
    Gouvernement
  </p>
);
