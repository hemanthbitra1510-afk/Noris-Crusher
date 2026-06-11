import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
/* ================= TYPES ================= */

interface QuarryFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: QuarryFormData) => void;
  initialData?: Partial<QuarryFormData>;
  isEdit?: boolean;
}

interface Ledger {
  ID: string;
  Party: string;
  Type: string;
  Status: string;
}

interface QuarryFormData {
  QuarryName: string;
  Extractor: string;
  Rate: string;
  OpeningBalance: string;
  Date1: string; // yyyy-mm-dd
}

/* ================= HELPERS ================= */

const getToday = () => new Date().toISOString().split("T")[0];

const formatDDMMYYYYToYYYYMMDD = (date: string) => {
  const accessDenied = checkPageAccess("Quarry", "Contractor");
  if (accessDenied) return accessDenied;

  if (!date) return getToday();
  const [dd, mm, yyyy] = date.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

/* ================= COMPONENT ================= */

const QuarryForm: React.FC<QuarryFormProps> = ({
  show,
  onHide,
  onSubmit,
  initialData,
  isEdit,
}) => {
  const [formData, setFormData] = useState<QuarryFormData>({
    QuarryName: "",
    Extractor: "",
    Rate: "",
    OpeningBalance: "",
    Date1: getToday(),
  });

  const [contractors, setContractors] = useState<Ledger[]>([]);

  /* ---------- LOAD FORM DATA ---------- */
  useEffect(() => {
    if (!show) return;

    if (isEdit && initialData) {
      setFormData({
        QuarryName: initialData.QuarryName ?? "",
        Extractor: initialData.Extractor ?? "",
        Rate: String(initialData.Rate ?? ""),
        OpeningBalance: String(initialData.OpeningBalance ?? ""),
        Date1: initialData.Date1
          ? formatDDMMYYYYToYYYYMMDD(initialData.Date1)
          : getToday(),
      });
    } else {
      setFormData({
        QuarryName: "",
        Extractor: "",
        Rate: "0",
        OpeningBalance: "0",
        Date1: getToday(),
      });
    }
  }, [show, isEdit, initialData]);

  /* ---------- FETCH CONTRACTORS ---------- */
  useEffect(() => {
    if (!show) return;

    const fetchContractors = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems");
        if (!id) return;

        const res = await fetch(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        const data = await res.json();

        const filtered = (Array.isArray(data) ? data : []);

        setContractors(filtered);
      } catch (err) {
        console.error("Failed to fetch contractors", err);
      }
    };

    fetchContractors();
  }, [show]);

  /* ---------- SEARCHABLE OPTIONS ---------- */
  const contractorOptions = contractors.map((c) => ({
    value: c.Party,
    label: c.Party,
  }));

  /* ---------- HANDLERS ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  /* ================= RENDER ================= */

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? "Edit Quarry" : "Add Quarry"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Quarry */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Quarry</Form.Label>
                <Form.Control
                  name="QuarryName"
                  value={formData.QuarryName}
                  onChange={handleChange}
                  placeholder="Enter quarry name"
                  disabled={isEdit}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Contractor (SEARCHABLE) */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Contractor</Form.Label>

                <Select
                  isSearchable
                  placeholder="Select Contractor"
                  options={contractorOptions}
                  value={
                    contractorOptions.find(
                      (opt) => opt.value === formData.Extractor
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Extractor: selected ? selected.value : "",
                    })
                  }
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                    }),
                  }}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Rate & Opening Balance */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Rate</Form.Label>
                <Form.Control
                  type="number"
                  name="Rate"
                  value={formData.Rate}
                  onChange={handleChange}
                  placeholder="Enter rate"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Opening Balance</Form.Label>
                <Form.Control
                  type="number"
                  name="OpeningBalance"
                  value={formData.OpeningBalance}
                  onChange={handleChange}
                  placeholder="Enter opening balance"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Date */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="Date1"
                  value={formData.Date1}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuarryForm;
