import { useState } from "react";
import moment, { Moment } from "moment";

interface PredefinedDatePickerProps {
  onChange?: (start: string | null, end: string | null) => void;
  defaultRange?: boolean;
}

const DISPLAY_FORMAT = "YYYY-MM-DD";
const API_FORMAT = "YYYY-MM-DD";

export default function PredefinedDatePicker({
  onChange,
  defaultRange = true,
}: PredefinedDatePickerProps) {

  const TODAY = moment().format(DISPLAY_FORMAT);
  const ONE_YEAR_AGO = moment().subtract(1, "year").format(DISPLAY_FORMAT);

  const defaultStart = defaultRange
    ? moment().subtract(6, "days").format(DISPLAY_FORMAT)
    : "";

  const defaultEnd = defaultRange
    ? moment().format(DISPLAY_FORMAT)
    : "";

  const [startDate, setStartDate] = useState<string | null>(defaultStart);
  const [endDate, setEndDate] = useState<string | null>(defaultEnd);

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (onChange) onChange(value || null, endDate);
  };

  const handleEndChange = (value: string) => {
    setEndDate(value);
    if (onChange) onChange(startDate, value || null);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    if (onChange) onChange(null, null);
  };

  return (
    <div className="d-flex align-items-center gap-2">

      {/* FROM DATE */}
      <input
        type="date"
        className="form-control"
        value={startDate || ""}
        min={ONE_YEAR_AGO}
        max={TODAY}
        onChange={(e) => handleStartChange(e.target.value)}
      />

      {/* TO DATE */}
      <input
        type="date"
        className="form-control"
        value={endDate || ""}
        min={ONE_YEAR_AGO}
        max={TODAY}
        onChange={(e) => handleEndChange(e.target.value)}
      />

      {(startDate || endDate) && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={handleClear}
        >
          Clear
        </button>
      )}

    </div>
  );
}