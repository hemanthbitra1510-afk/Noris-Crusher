import { checkPageAccess } from "../../../utils/permission";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form, Row, Col } from "react-bootstrap";
import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import axios from "axios";
import Select from "react-select";
import { useToast } from "../../../components/reuse-components/Toast";

interface Bank {
  Bank: string;
  AccNo: string;
}

interface ModalProps {
  show: boolean;
  onClose: () => void;
  handleSubmit1: (formData: any) => void;
  initialData: any | null;
}

const ContraForm = ({ show, onClose, handleSubmit1, initialData }: ModalProps) => {
  const showToast = useToast();
  const [formData, setFormData] = useState({
    FromBank: "",
    ToBank: "",
    Description: "",
    Date1: "",
    Amount: "",
    IDS: "",
  });

  const [banks, setBanks] = useState<Bank[]>([]);

  const fetchBanks = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetBankDetails`
      );
      setBanks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchBanks();
    }
  }, [show, fetchBanks]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        FromBank: initialData.FromBank || "",
        ToBank: initialData.ToBank || "",
        Description: initialData.Description || "",
        Date1: initialData.Date1 || "",
        Amount: initialData.Amount || "",
        IDS: initialData.ID || "",
      });
    } else {
      setFormData({
        FromBank: "",
        ToBank: "",
        Description: "",
        Date1: dayjs().format("DD-MM-YYYY"),
        Amount: "",
        IDS: "",
      });
    }
  }, [initialData, show]);

  const accessDenied = checkPageAccess("Accounts", "Contra");
  if (accessDenied) return accessDenied;

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (formData.FromBank === formData.ToBank) {
      showToast("Validation Error", "From Bank and To Bank cannot be the same.", "danger");
      return;
    }
    handleSubmit1(formData);
  };

  const fromBankOptions = banks
    .filter((b) => `${b.Bank} (${b.AccNo})` !== formData.ToBank)
    .map((b) => ({
      value: `${b.Bank} (${b.AccNo})`,
      label: `${b.Bank} (${b.AccNo})`,
    }));

  const toBankOptions = banks
    .filter((b) => `${b.Bank} (${b.AccNo})` !== formData.FromBank)
    .map((b) => ({
      value: `${b.Bank} (${b.AccNo})`,
      label: `${b.Bank} (${b.AccNo})`,
    }));

  if (accessDenied) return accessDenied;

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <OffcanvasHeader closeButton>
        <h4 className="fw-bold text-dark">
          {initialData ? "Edit Contra Entry" : "Add Contra Entry"}
        </h4>
      </OffcanvasHeader>

      <OffcanvasBody>
        <Form onSubmit={handleSubmit}>
          <h6 className="text-uppercase text-muted mb-3">Contra Details</h6>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Date</Form.Label>
                <CommonDatePicker
                  value={formData.Date1 ? dayjs(formData.Date1, "DD-MM-YYYY") : null}
                  format="DD-MM-YYYY"
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      Date1: date ? dayjs(date).format("DD-MM-YYYY") : "",
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">From Bank (Cash/Bank)</Form.Label>
                <Select
                  options={fromBankOptions}
                  value={fromBankOptions.find((opt) => opt.value === formData.FromBank) || null}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      FromBank: selected?.value || "",
                    }))
                  }
                  placeholder="Select Withdrawal From"
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">To Bank (Cash/Bank)</Form.Label>
                <Select
                  options={toBankOptions}
                  value={toBankOptions.find((opt) => opt.value === formData.ToBank) || null}
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      ToBank: selected?.value || "",
                    }))
                  }
                  placeholder="Select Deposit To"
                  isClearable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Amount</Form.Label>
                <Form.Control
                  type="number"
                  name="Amount"
                  value={formData.Amount}
                  onChange={handleChange}
                  placeholder="Enter Amount"
                  className="rounded-3"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  placeholder="Enter internal transfer details"
                  className="rounded-3"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-light border me-2 px-4"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn btn-primary px-4" type="submit">
              {initialData ? "Update Entry" : "Save Entry"}
            </button>
          </div>
        </Form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default ContraForm;
