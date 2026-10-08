import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

interface StepIndicatorProps {
  title: ReactNode;
  currentStep: number;
  stepCount: number;
  label?: string;
  nextStep?: ReactNode;
  className?: string;
}

export const StepIndicator = ({
  title,
  currentStep,
  stepCount,
  label,
  nextStep,
  className,
}: StepIndicatorProps) => (
  <div className={clsxm("mb-8 flex flex-col", className)}>
    <h2 className="mt-0 mb-3 flex flex-col text-lg leading-6 font-bold text-dsfr-grey-50 md:text-xl md:leading-7">
      <span className="text-sm leading-8 font-normal text-dsfr-mention-grey">
        {`${label ? `${label} - ` : ""}Étape ${currentStep} sur ${stepCount}`}
      </span>{" "}
      {title}
    </h2>
    <div aria-hidden className="flex h-2 w-full gap-2">
      {[...Array(stepCount).keys()].map((stepIndex) => (
        <span
          className={clsxm(
            "h-full flex-1",
            stepIndex < currentStep
              ? "bg-dsfr-blue-france-sun-113"
              : "bg-dsfr-contrast-grey",
          )}
          key={stepIndex}
        />
      ))}
    </div>
    {nextStep && currentStep < stepCount ? (
      <p className="mt-3 mb-0 text-xs text-dsfr-mention-grey">
        <span className="font-bold">Étape suivante :</span> {nextStep}
      </p>
    ) : null}
  </div>
);
