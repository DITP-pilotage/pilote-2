import { ComboboxPicker } from "@/components/shared/ComboboxPicker";
import { SelectPicker } from "@/components/shared/SelectPicker";
import type { PickerProps } from "@/components/shared/pickerTypes";

export const Picker = <T extends string>({
  showSearch = true,
  ...props
}: PickerProps<T> & { showSearch?: boolean }) =>
  showSearch ? <ComboboxPicker {...props} /> : <SelectPicker {...props} />;
