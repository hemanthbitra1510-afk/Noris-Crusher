
import { checkPageAccess } from "../../../utils/permission";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import Select from "react-select";

interface ModalProps {
  show: boolean;
  onClose: () => void;
  handleSubmit1: (formData: any) => void;
  initialData: any | null;
}

const VoucherForm = ({ show, onClose, handleSubmit1, initialData }: ModalProps) => {
  const [formData, setFormData] = useState({
    VoucherType: "",
    Typed: "Both",
    IDS: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        VoucherType: initialData.VoucherType || "",
        Typed: initialData.Typed || "Both",
        IDS: initialData.ID || "",
      });
    } else {
      setFormData({
        VoucherType: "",
        Typed: "Both",
        IDS: "",
      });
    }
  }, [initialData, show]);

  const accessDenied = checkPageAccess("Accounts", "Vouchers");
  if (accessDenied) return accessDenied;

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    handleSubmit1(formData);
  };

  const typedOptions = [
    { value: "Receipt", label: "Receipt" },
    { value: "Payment", label: "Payment" },
    { value: "Both", label: "Both" },
  ];

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <OffcanvasHeader closeButton>
        <h4 className="fw-bold text-dark">
          {initialData ? "Edit Voucher" : "Add Voucher"}
        </h4>
      </OffcanvasHeader>

      <OffcanvasBody>
        <Form onSubmit={handleSubmit}>
          <h6 className="text-uppercase text-muted mb-3">Voucher Details</h6>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Voucher Type</Form.Label>
                <Form.Control
                  type="text"
                  name="VoucherType"
                  value={formData.VoucherType}
                  onChange={handleChange}
                  placeholder="Enter Voucher Type"
                  className="rounded-3"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Typed</Form.Label>
                <Select
                  options={typedOptions}
                  value={typedOptions.find((opt) => opt.value === formData.Typed)}
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Typed: selected ? selected.value : "Both",
                    })
                  }
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
              {initialData ? "Update Voucher" : "Save Voucher"}
            </button>
          </div>
        </Form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default VoucherForm;
