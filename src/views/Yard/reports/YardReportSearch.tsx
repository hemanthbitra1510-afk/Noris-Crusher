import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import axios from "axios";
import Select from "react-select";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

interface Ledger {
  ID: string;
  Party: string;
  Type: string;
  Status: string;
}

interface Material {
  ID: string;
  Material: string;
}

const YardReportSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Yard", "Reports");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Vehicle: "",
    Material: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  const [vehicles, setVehicles] = useState<Ledger[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  /* ================= FETCH APIs ================= */

  useEffect(() => {
    if (show) {
      fetchVehicles();
      fetchMaterials();
    }
  }, [show]);
  const handleCloseWithReset = () => {
    setFormData({
      Vehicle: "",
      Material: "",
      FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
      ToDate: moment().format("YYYY-MM-DD"),
    });
    handleClose();
  };

  const fetchVehicles = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<Ledger[]>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );

      const vehicleOnly = (res.data || []);

      setVehicles(vehicleOnly);
    } catch (err) {
      console.error("Failed to load vehicles", err);
      setVehicles([]);
    }
  };

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

  /* ================= UI ================= */

  const onApplyFilters = () => {
    const payload = { ...formData };
    if (!payload.FromDate || !payload.ToDate) {
      payload.FromDate = moment().subtract(6, "days").format("YYYY-MM-DD");
      payload.ToDate = moment().format("YYYY-MM-DD");
    }
    handleSubmit(payload);
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Vehicle */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label>Vehicle</Form.Label>
              <Select
                placeholder="Select Vehicle"
                isSearchable
                isClearable
                options={vehicles.map((v) => ({
                  value: v.Party,
                  label: v.Party,
                }))}
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
          </Row>

          {/* Material */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label>Material</Form.Label>
              <Select
                placeholder="Select Material"
                isSearchable
                isClearable
                options={materials.map((m) => ({
                  value: m.Material,
                  label: m.Material,
                }))}
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

          {/* Date Range */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Select Date Range</Form.Label>
                <PredefinedDatePicker
                  onChange={(start, end) =>
                    setFormData({
                      ...formData,
                      FromDate: start,
                      ToDate: end,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseWithReset}>
          Cancel
        </Button>

        <Button variant="primary" onClick={onApplyFilters}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default YardReportSearch;
