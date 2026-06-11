import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import axios from "axios";
import Select from "react-select";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const TransPortReportSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Transporter", "Reports");
  if (accessDenied) return accessDenied;

  const [transporters, setTransporters] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    Transporter: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  useEffect(() => {
    if (show) fetchTransporters();
  }, [show]);

  const handleApply = () => {
    handleSubmit(formData);   // 🔥 Send only filters
    handleClose();
  };

  const fetchTransporters = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );

      const transportList = res.data
        .map((item: any) => item.Party); // or item.AccountName (adjust based on API response)

      // Remove duplicates
      const uniqueTransporters = [...new Set(transportList)];

      setTransporters(uniqueTransporters);
    } catch (err) {
      console.error("Error loading transporter list:", err);
    }
  };


  return (
    <Modal show={show} onHide={handleClose} centered size="sm" className="search-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Transporter Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Select Transporter</Form.Label>
              <Select
                options={transporters.map((t) => ({
                  label: t,
                  value: t,
                }))}
                isClearable
                placeholder="Search transporter..."
                value={
                  formData.Transporter
                    ? { label: formData.Transporter, value: formData.Transporter }
                    : null
                }
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    Transporter: selected ? selected.value : "",
                  }))
                }
              />
            </Form.Group>

          </Row>

          {/* Date Range */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Start Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.FromDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      FromDate: e.target.value,
                    }))
                  }
                />

              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>End Date & Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.ToDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ToDate: e.target.value,
                    }))
                  }
                />

              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-warning" className="px-4 fw-semibold" onClick={handleClose}>
          Cancel
        </Button>

        <Button
          variant="danger"
          className="px-4 fw-semibold"
          onClick={handleApply}
        >
          Apply
        </Button>

      </Modal.Footer>
    </Modal>
  );
};

export default TransPortReportSearch;
