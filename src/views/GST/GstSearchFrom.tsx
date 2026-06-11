import { hasPermission, checkPageAccess } from "../../utils/permission";
import { useState } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../components/common-dateRangePicker/PredefinedDatePicker";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const GstSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("GST", "Gstsearchfrom");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Select Date Range</Form.Label>
                <PredefinedDatePicker
                  onChange={(from, to) =>
                    setFormData({ ...formData, FromDate: from, ToDate: to })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
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
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default GstSearch;

