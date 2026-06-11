import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState,useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { Account_Type } from "../../../constants/constants";
interface BankFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: any) => void;
  initialData?: Partial<DebitorDeal>;
  isEdit?: boolean;
}

const getToday = () => new Date().toISOString().split("T")[0];


const normalizeAccType = (value?: string) => {
  const accessDenied = checkPageAccess("Masters", "Banks");
  if (accessDenied) return accessDenied;

  if (!value) return "";

  const match = Account_Type.find(
    (a) => a.code.toLowerCase() === value.toLowerCase()
  );

  return match ? match.code : value;
};

const toInputDate = (date?: string) => {
  if (!date) return getToday();

  // converts DD-MM-YYYY → YYYY-MM-DD
  const [dd, mm, yyyy] = date.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

const IssueForm = ({  show,
  onHide,
  onSubmit,
  initialData,
  isEdit,}: BankFormProps) => {
  const [formData, setFormData] = useState({
    Bank: "",
    AccName: "",
    AccNo: "",
    AccBranch: "",
    AccType: "",
    OpeningBalance: "0",
    Date1: getToday(),
    PrimaryAcc: "",
  });
  useEffect(() => {
  if (isEdit && initialData) {
    // EDIT MODE → show OB & OBDate
    setFormData({
      Bank: initialData.Bank ?? "",
      AccName: initialData.AccName ?? "",
      AccNo: initialData.AccNo ?? "",
      AccBranch: initialData.AccBranch ?? "",
      AccType: normalizeAccType(initialData.AccType),

      OpeningBalance: String(initialData.OB ?? "0"),
      Date1: toInputDate(initialData.OBDate),

      PrimaryAcc: initialData.PrimaryAcc ?? "",
    });
  }

  if (!isEdit) {
    // ADD MODE → clean form
    setFormData({
      Bank: "",
      AccName: "",
      AccNo: "",
      AccBranch: "",
      AccType: "",
      OpeningBalance: "",
      Date1: getToday(),
      PrimaryAcc: "",
    });
  }
}, [initialData, isEdit]);

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  // 20-character limited text fields
  const limit20 = ["Bank", "AccName", "AccBranch"];

  if (limit20.includes(name)) {
    setFormData((prev) => ({
      ...prev,
      [name]: value.slice(0, 20),
    }));
    return;
  }

  // Account Number: only digits, max 30
  if (name === "AccNo") {
    const numericValue = value.replace(/\D/g, "").slice(0, 30);
    setFormData((prev) => ({
      ...prev,
      AccNo: numericValue,
    }));
    return;
  }

  // Opening Balance default to 0
  if (name === "OpeningBalance") {
    setFormData((prev) => ({
      ...prev,
      OpeningBalance: value === "" ? "0" : value,
    }));
    return;
  }

  // Default
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleSubmit = () => {
  if (!formData.Bank.trim()) {
    alert("Bank is required");
    return;
  }

  if (!formData.AccName.trim()) {
    alert("Account Name is required");
    return;
  }

  if (!formData.AccNo.trim()) {
    alert("Account Number is required");
    return;
  }

  if (!formData.OpeningBalance) {
    alert("Opening Balance is required");
    return;
  }

  if (!formData.AccType) {
    alert("Please select Account Type");
    return;
  }

  if (!formData.PrimaryAcc) {
    alert("Please select Primary Account");
    return;
  }
  

  onSubmit(formData);
};


  return (
    <Modal
  show={show}
  onHide={onHide}
  centered
  size="md"
  scrollable={false}
  backdrop="static"
  keyboard={false}
>

      <Modal.Header closeButton>
        <Modal.Title>Add Bank</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Name</Form.Label>
                <Form.Control
  name="Bank"
  value={formData.Bank}
  onChange={handleChange}
  placeholder="Enter bank name"
  maxLength={20}
  disabled={isEdit}
/>

              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Account Name</Form.Label>
                <Form.Control
  name="AccName"
  value={formData.AccName}
  onChange={handleChange}
  placeholder="Enter account holder name"
  maxLength={20}
/>

              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Account Number</Form.Label>
<Form.Control
  name="AccNo"
  value={formData.AccNo}
  onChange={handleChange}
  placeholder="Enter account number"
  inputMode="numeric"
  maxLength={30}
/>


              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Account Branch</Form.Label>
                <Form.Control
  name="AccBranch"
  value={formData.AccBranch}
  onChange={handleChange}
  placeholder="Enter branch name"
  maxLength={20}
/>

              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Account Type</Form.Label>
                <CreatableSelect
                  name="AccType"
                  options={Account_Type.map((a) => ({
                    value: a.code,
                    label: a.name
                  }))}
                  value={
                    formData.AccType
                      ? { value: formData.AccType, label: formData.AccType }
                      : null
                  }
                  onChange={(selectedOption: any) => {
                    setFormData((prev) => ({
                      ...prev,
                      AccType: selectedOption?.value || "",
                    }));
                  }}
                  placeholder="Select or type account type"
                  isClearable
                  classNamePrefix="react-select"
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
  min={0}
  placeholder="Enter opening balance"
/>

              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="Date1"
                  value={formData.Date1}
                  onChange={handleChange}
                  max={getToday()}  
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Primary Account</Form.Label>
                <Form.Select name="PrimaryAcc" value={formData.PrimaryAcc} onChange={handleChange}>
  <option value="">Select Primary Account</option>
<option value="Yes">Yes</option>
<option value="No">No</option>

</Form.Select>

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

export default IssueForm;
