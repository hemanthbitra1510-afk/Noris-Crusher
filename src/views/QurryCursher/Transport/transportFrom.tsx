import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import axios from "axios";
import { Mersurment } from "../../../constants/constants";
import Select from "react-select";
/* ================= TYPES ================= */

interface Ledger {
  Party: string;
  Type: string;
  ID: string;
  Status: string;
}

interface TransportFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: TransportFormData) => void;
}

interface TransportFormData {
  Transporter: string;
  Measurement: string;
  Rate: string;
  Date1: string;
}

const getToday = () => new Date().toISOString().split("T")[0];

/* ================= COMPONENT ================= */

const TransportForm: React.FC<TransportFormProps> = ({
  show,
  onHide,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TransportFormData>({
    Transporter: "",
    Measurement: "",
    Rate: "",
    Date1: getToday(),
  });

  const [transporters, setTransporters] = useState<Ledger[]>([]);

  /* ================= FETCH TRANSPORTERS ================= */

  useEffect(() => {
    if (!show) return;

    const fetchTransporters = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get<Ledger[]>(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        const activeTransporters = (res.data || []);

        setTransporters(activeTransporters);
      } catch (err) {
        console.error("Failed to load transporters", err);
        setTransporters([]);
      }
    };

    fetchTransporters();
  }, [show]);

  /* ================= SELECT OPTIONS ================= */

  const transporterOptions = transporters.map((t) => ({
    value: t.Party,
    label: t.Party,
  }));

  const measurementOptions = Mersurment.map((m) => ({
    value: m.code,
    label: m.name,
  }));

  /* ================= HANDLERS ================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const accessDenied = checkPageAccess("Quarry", "Transport");
    if (accessDenied) return accessDenied;

    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.Transporter) {
      alert("Please select Transporter");
      return;
    }
    if (!formData.Measurement) {
      alert("Please select Measurement");
      return;
    }
    if (!formData.Rate) {
      alert("Rate is required");
      return;
    }

    onSubmit(formData);

    setFormData({
      Transporter: "",
      Measurement: "",
      Rate: "",
      Date1: getToday(),
    });
  };

  /* ================= UI ================= */

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Add Transport</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Transporter (SEARCHABLE) */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Transporter</Form.Label>

                <Select
                  isSearchable
                  placeholder="Select Transporter"
                  options={transporterOptions}
                  value={
                    transporterOptions.find(
                      (opt) => opt.value === formData.Transporter
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Transporter: selected ? selected.value : "",
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

          {/* Measurement (SEARCHABLE) + Rate */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Measurement</Form.Label>

                <Select
                  isSearchable
                  placeholder="Select Measurement"
                  options={measurementOptions}
                  value={
                    measurementOptions.find(
                      (opt) => opt.value === formData.Measurement
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Measurement: selected ? selected.value : "",
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

export default TransportForm;

