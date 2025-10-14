import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { InputNote } from "@/components/_commons/InputNote";

export const InputNoteAutoEvaluation = ({
  name,
}: {
  name: `criteres.${number}.note` | `objectifs.${number}.note`;
}) => {
  const form = useFormEvaluation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();

  return (
    <InputNote
      control={form.control}
      name={name}
      readOnly={autoEvaluation.readOnly}
    />
  );
};
