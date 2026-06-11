import { hasPermission, checkPageAccess } from "../../utils/permission";
import { useState, useEffect } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import axios from "axios";
import Select from "react-select";
import PredefinedDatePicker from "../../components/common-dateRangePicker/PredefinedDatePicker";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
  initialFilters?: any;
}

interface Ledger {
  ID: string;
  Party: string;
  Type: string;
  Status: string;
}

const SalesSearch = ({ show, handleClose, handleSubmit, initialFilters }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Sales", "Salessearch");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Party: "",
    Material: "",
    Vehicle: "",
    Driver: "",
    Transporter: "",
    FromDate: "",
    ToDate: "",
  });

  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  useEffect(() => {
    if (show) {
      fetchLedgers();
      fetchMaterials();
      
      if (initialFilters) {
        setFormData({
          Party: initialFilters.Party || "",
          Material: initialFilters.Material || "",
          Vehicle: initialFilters.Vehicle || "",
          Driver: initialFilters.Driver || "",
          Transporter: initialFilters.Transporter || "",
          FromDate: initialFilters.FromDate || "",
          ToDate: initialFilters.ToDate || "",
        });
      }
    }
  }, [show, initialFilters]);

  // ✅ USE THIS API (PLURAL: MyLedgers)
  const fetchLedgers = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<Ledger[]>(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      setLedgers(res.data || []);
    } catch (err) {
      console.error("Failed to load MyLedgers", err);
      setLedgers([]);
    }
  };
  interface Material {
    ID: string;
    Material: string;
  }

  const [materials, setMaterials] = useState<Material[]>([]);

  const fetchMaterials = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<Material[]>(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
      );

      setMaterials(res.data || []);
    } catch (err) {
      console.error("Failed to load materials", err);
      setMaterials([]);
    }
  };

  const toOptions = (type: string) =>
    ledgers
      .filter(l => l.Type === type)
      .map(l => ({ value: l.Party, label: l.Party }));

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-2">
            <Col md={6}>
              <Form.Label>Party</Form.Label>
              <Select
                options={ledgers.map(l => ({ value: l.Party, label: l.Party }))}
                isSearchable
                isClearable
                value={
                  formData.Party
                    ? { value: formData.Party, label: formData.Party }
                    : null
                }
                onChange={(o) =>
                  setFormData({ ...formData, Party: o?.value || "" })
                }
              />
            </Col>

            <Col md={6}>
              <Form.Label>Material</Form.Label>
              <Select
                options={materials.map(m => ({
                  value: m.Material,
                  label: m.Material,
                }))}
                isSearchable
                isClearable
                value={
                  formData.Material
                    ? { value: formData.Material, label: formData.Material }
                    : null
                }
                onChange={(o) =>
                  setFormData({ ...formData, Material: o?.value || "" })
                }
              />

            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={6}>
              <Form.Label>Vehicle</Form.Label>
              <Select
                options={toOptions("Vehicle")}
                isSearchable
                isClearable
                value={
                  formData.Vehicle
                    ? { value: formData.Vehicle, label: formData.Vehicle }
                    : null
                }
                onChange={(o) =>
                  setFormData({ ...formData, Vehicle: o?.value || "" })
                }
              />
            </Col>

            <Col md={6}>
              <Form.Label>Driver</Form.Label>
              <Form.Control
                value={formData.Driver}
                onChange={(e) =>
                  setFormData({ ...formData, Driver: e.target.value })
                }
                placeholder="Enter Driver"
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col md={6}>
              <Form.Label>Transporter</Form.Label>
              <Select
                options={toOptions("Transport")}
                isSearchable
                isClearable
                value={
                  formData.Transporter
                    ? { value: formData.Transporter, label: formData.Transporter }
                    : null
                }
                onChange={(o) =>
                  setFormData({ ...formData, Transporter: o?.value || "" })
                }
              />
            </Col>

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
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-warning" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => {
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

export default SalesSearch;

