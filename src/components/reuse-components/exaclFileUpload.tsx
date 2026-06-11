



// ExcelUpload.tsx
import { useState, useRef, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import * as XLSX from "xlsx";

interface ExcelUploadProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: any[]) => void;
  // optional: expected headers to warn user (not required)
  expectedHeaders?: string[];
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ show, onHide, onSubmit, expectedHeaders = [] }) => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parseFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
      if (expectedHeaders.length > 0) {
        const actualHeaders = Object.keys(json[0] || {});
        const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(", ")}`);
        }
      }

      setExcelData(json);
    } catch (e) {
      console.error(e);
      setError("Failed to read file. Make sure it's a valid Excel/CSV file.");
      setExcelData([]);
    }
  }, [expectedHeaders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    parseFile(f);
  };

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(false);
    const f = ev.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  const handleDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSave = () => {
    onSubmit(excelData);
    setExcelData([]);
    setFileName("");
  };

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fw-semibold">Upload Excel File</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Drag & Drop box */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: isDragging ? "2px solid #0d6efd" : "2px dashed #6c757d",
            borderRadius: 10,
            padding: 28,
            textAlign: "center",
            cursor: "pointer",
            userSelect: "none",
            transition: "border .15s",
          }}
        >
          <i className="bi bi-cloud-arrow-up display-4 text-primary"></i>
          <p className="mb-0 fw-semibold text-dark">Click or drag & drop Excel file here</p>
          <small className="text-muted">.xlsx .xls .csv</small>

          {fileName && <div className="mt-2 text-success fw-semibold">{fileName}</div>}
          {error && <div className="mt-2 text-danger small">{error}</div>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* quick preview counts */}
        <div className="mt-3">
          <small className="text-dark">
            Rows parsed: <strong>{excelData.length}</strong>
          </small>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => { setExcelData([]); setFileName(""); onHide(); }}>
          Close
        </Button>
        <Button variant="primary" disabled={excelData.length === 0} onClick={() => { handleSave(); onHide(); }}>
          Preview
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ExcelUpload;
