import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

type CommonPhoneInputProps = {
  name: string;
  value?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  containerClassName?: string;
  inputClassName?: string;
  placeholder?: string;
};

const CommonPhoneInput: React.FC<CommonPhoneInputProps> = ({
  name,
  value = "",
  onChange,
  onBlur,
  containerClassName = "form-control",
  inputClassName = "",
  placeholder = "Enter phone number",
}) => {
  const handleChange = (val: string | undefined) => {
    if (!onChange) return;
    const event = {
      target: { name, value: val ?? "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  return (
    <div className={containerClassName}>
      <PhoneInput
        defaultCountry="IN"
        value={value || ""}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={inputClassName ? `phone-input ${inputClassName}` : "phone-input"}
      />
    </div>
  );
};

export default CommonPhoneInput;
