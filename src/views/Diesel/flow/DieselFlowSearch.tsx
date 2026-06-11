import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker"; // import your date picker
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleShow: () => void;
  handleSubmit: (formData: any) => void;
}

const DieselFlowSearch = ({ show, handleClose,  handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Diesel", "Flow");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    FromDate: "",
    ToDate: "",
  });

  return (
    <>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Search Filters</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* Date Picker */}
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Select Date Range</Form.Label>
                  <PredefinedDatePicker
                    onChange={(start, end) => {
                      console.log("📅 Date Range Selected:", { start, end });
                      setFormData({
                        ...formData,
                        FromDate: start, // YYYY-MM-DD
                        ToDate: end,     // YYYY-MM-DD
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
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
    </>
  );
};

export default DieselFlowSearch;

