import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Col, Modal, Row, Form, Button, Card } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const DieselIssueSearchModal = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Diesel", "Issue");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Vehicle: "",
    FromDate: "",
    ToDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Search Filters</Modal.Title>
      </Modal.Header>
      <Modal.Body>
            <Form>
              {/* Date Picker */}
                <Row className="mb-4">
                <Col>
                  <Form.Group>
                    <Form.Label>Vehicle No.</Form.Label>
                    <Form.Control
                      type="text"
                      name="Vehicle"
                      value={formData.Vehicle}
                      onChange={handleChange}
                      placeholder="e.g. KA-01-AB-1234"
                      className="shadow-sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Label>Date Range</Form.Label>
                    <PredefinedDatePicker
                      onChange={(start, end) => {
                        setFormData({
                          ...formData,
                          FromDate: start,
                          ToDate: end,
                        });
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Vehicle */}
            
            </Form>

      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => {
  const payload = { ...formData };
  if (!payload.FromDate || !payload.ToDate) {
    payload.FromDate = moment().subtract(6, "days").format("YYYY-MM-DD");
    payload.ToDate = moment().format("YYYY-MM-DD");
  }
  handleSubmit(payload);
}}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DieselIssueSearchModal;
