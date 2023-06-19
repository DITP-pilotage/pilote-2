/* eslint-disable react/no-multi-comp */
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import Select, { components, MenuListProps, MultiValue, OptionProps, ValueContainerProps } from 'react-select';
import useStateRef from '@/client/hooks/useStateRef';
import MultiSelectStyled from './MultiSelect.styled';
import MultiSelectProps, { MultiSelectOption } from './MultiSelect.interface';

function ValueContainerPersonnalisé({ children, ...props }: ValueContainerProps<{ label: string, value: string }, true, { label: string; options: { label: string; value: string; }[]; }>) {
  const valeursSélectionnées = props.getValue();
  const input = (children as [unknown, ReactNode])[1];

  return (
    <components.ValueContainer {...props}>
      {input}
      {valeursSélectionnées.length > 0 ? `${valeursSélectionnées.length} territoire(s) sélectionné(s)` : 'Sélectionner un territoire'}
    </components.ValueContainer>
  );
}

function MenuListPersonnalisé({ selectProps, ...props }: MenuListProps<{ label: string, value: string }, true, { label: string; options: { label: string; value: string; }[]; }>) {
  const { onInputChange, inputValue  } = selectProps;

  const ariaAttributes: any = {
    'aria-autocomplete': 'list',
    'aria-label': selectProps['aria-label'],
    'aria-labelledby': selectProps['aria-labelledby'],
  };

  return (
    <components.MenuList
      {...props}
      selectProps={selectProps}
    >
      <input
        autoComplete="off"
        autoCorrect="off"
        onChange={(e) =>
          onInputChange(e.currentTarget.value, {
            action: 'input-change',
            prevInputValue: e.currentTarget.value,
          })}
        onMouseDown={(e) => {
          e.stopPropagation();
          //@ts-ignore
          e.target.focus();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          //@ts-ignore
          e.target.focus();
        }}
        placeholder="Rechercher..."
        spellCheck="false"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 10,
          border: 'none',
          borderBottom: '1px solid lightgrey',
        }}
        type="text"
        value={inputValue}
        {...ariaAttributes}
      />
      {props.children}
    </components.MenuList>
  );
}

function InputOption({
  getStyles,
  isDisabled,
  isFocused,
  isSelected,
  children,
  innerProps,
  ...rest
}: OptionProps<{ label: string, value: string }, true, { label: string; options: { label: string; value: string; }[]; }>) {
  const style = {
    alignItems: 'center',
    backgroundColor: isFocused ? '#eee' : 'transparent',
    display: 'flex',
    color: isDisabled ? '#ccc' : 'inherit',
  };

  const props = {
    ...innerProps,
    style,
  };

  return (
    <components.Option
      {...rest}
      getStyles={getStyles}
      innerProps={props}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
    >
      <input
        checked={isSelected}
        disabled={isDisabled}
        readOnly
        type="checkbox"
      />
      {children}
    </components.Option>
  );
}


  
export default function MultiSelect({ libellé, optionsGroupées, ouvertureCallback, changementValeursSélectionnéesCallback }: MultiSelectProps) {
  const [estOuvert, setEstOuvert, estOuvertRef] = useStateRef<boolean>(false);
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ouvertureCallback(estOuvert);
  }, [estOuvert, ouvertureCallback]);

  const formatGroupLabel = (data: typeof optionsGroupées[number]) => {
    return (
      <div>
        <span>
          {data.label}
        </span>
      </div>
    );
  };

  const onDomClick = useCallback((e: MouseEvent) => 
    conteneurRef.current!.contains(e.target as Node) && !estOuvertRef.current ? setEstOuvert(true) : setEstOuvert(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  , []);

  const onKeyup = useCallback((e: KeyboardEvent) => {
    if (estOuvertRef.current && e.code === 'Escape') {
      setEstOuvert(false);
    }
    if (!estOuvertRef.current && e.code === 'Space') {
      setEstOuvert(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    document.addEventListener('mousedown', onDomClick);
    document.addEventListener('keyup', onKeyup);

    return () => {
      document.removeEventListener('mousedown', onDomClick);
      document.removeEventListener('keyup', onKeyup);
    };
  }, [onDomClick, onKeyup]);
  
  return (
    <MultiSelectStyled>
      <div
        className='fr-select-group'
        ref={conteneurRef}
      >
        <label className='fr-label fr-mb-1w'>
          {libellé}
        </label>
        <Select
          classNames={{ menu: () => 'multiselect-menu ', valueContainer: () => 'multiselect-value-container fr-select', control: () => 'multiselect-control' }}
          closeMenuOnSelect={false}
          components={{
            ValueContainer: ValueContainerPersonnalisé, 
            MultiValue: () => null,
            MenuList: MenuListPersonnalisé,
            Option: InputOption,
            IndicatorSeparator: () => null,
            IndicatorsContainer: () => null,
          }}
          formatGroupLabel={formatGroupLabel}
          hideSelectedOptions={false}
          isMulti
          isSearchable={false}
          menuIsOpen={estOuvert}
          noOptionsMessage={() => 'Aucun résultat'}
          onChange={(valeurs :MultiValue<MultiSelectOption>) => changementValeursSélectionnéesCallback(valeurs.map(v => v.value))}
          options={optionsGroupées}
        />
      </div>
    </MultiSelectStyled>
  );
}
