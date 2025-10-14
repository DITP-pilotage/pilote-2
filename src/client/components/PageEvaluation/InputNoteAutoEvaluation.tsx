import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { InputNoteControlled } from "@/components/_commons/InputNoteControlled";

export const InputNoteAutoEvaluation = ({
  name,
}: {
  name: `criteres.${number}.note` | `objectifs.${number}.note`;
}) => {
  const form = useFormEvaluation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();

  return (
    <InputNoteControlled
      control={form.control}
      name={name}
      readOnly={autoEvaluation.readOnly}
    />
  );
};
