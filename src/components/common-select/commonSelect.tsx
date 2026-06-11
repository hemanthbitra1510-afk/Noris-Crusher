import React from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  value?: Option | null;
  onChange?: (option: Option | null) => void;
  className?: string;
  styles?: any;
}

const customComponents = {
  IndicatorSeparator: () => null,
};

const CommonSelect: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  const customStyles = {
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#E41F07"
        : state.isFocused
        ? "white"
        : "white",
      color: state.isSelected
        ? "#fff"
        : state.isFocused
        ? "#E41F07"
        : "#707070",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#E41F07",
        color: state.isSelected ? "white" : "#fff",
      },
    }),
  };

  return (
    <div className="common-select">
      <Select
        classNamePrefix="react-select"
        className={className}
        styles={customStyles}
        options={options}
        value={value}
        onChange={onChange}
        components={customComponents}
        placeholder="Select"
      />
    </div>
  );
};

export default CommonSelect;
