import { useEffect, useState } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import axios from "axios";
import Select from "react-select";

interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const InputMaterialsSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    Vehicle: "",
    Material: "",
    Party: "",
    FromDate: moment().subtract(7, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  useEffect(() => {
    if (show) {
      fetchFilters();
    }
  }, [show]);

  const fetchFilters = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      // Fetch Materials
      const resMat = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
      );
      if (resMat.data) {
        setMaterials([...new Set(resMat.data.map((item: any) => item.Material))]);
      }

      // Fetch Ledgers for Party dropdown
      const resLed = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );
      if (resLed.data) {
        const ledgerList = resLed.data.map((item: any) => item.Party);
        setParties([...new Set(ledgerList)]);
      }

      // Fetch Vehicles
      const resVeh = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );
      if (resVeh.data) {
        setVehicles([...new Set(resVeh.data.map((item: any) => item.VehicleNum))]);
      }
    } catch (err) {
      console.error("Error loading filters:", err);
    }
  };

  const handleApply = () => {
    handleSubmit(formData);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="sm" className="search-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Party Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Party</Form.Label>
              <Select
                options={parties.map((p) => ({ label: p, value: p }))}
                isClearable
                placeholder="Select Party"
                value={formData.Party ? { label: formData.Party, value: formData.Party } : null}
                onChange={(selected) => setFormData((prev) => ({ ...prev, Party: selected ? selected.value : "" }))}
              />
            </Form.Group>
          </Row>

          {/* Vehicle Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Vehicle</Form.Label>
              <Select
                options={vehicles.map((v) => ({ label: v, value: v }))}
                isClearable
                placeholder="Select Vehicle"
                value={formData.Vehicle ? { label: formData.Vehicle, value: formData.Vehicle } : null}
                onChange={(selected) => setFormData((prev) => ({ ...prev, Vehicle: selected ? selected.value : "" }))}
              />
            </Form.Group>
          </Row>

          {/* Material Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Material</Form.Label>
              <Select
                options={materials.map((m) => ({ label: m, value: m }))}
                isClearable
                placeholder="Select Material"
                value={formData.Material ? { label: formData.Material, value: formData.Material } : null}
                onChange={(selected) => setFormData((prev) => ({ ...prev, Material: selected ? selected.value : "" }))}
              />
            </Form.Group>
          </Row>

          {/* Date Range */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.FromDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, FromDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.ToDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ToDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-warning" onClick={handleClose}>Cancel</Button>
        <Button variant="danger" onClick={handleApply}>Apply</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InputMaterialsSearch;
