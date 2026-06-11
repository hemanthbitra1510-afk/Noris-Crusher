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

const DCSlipsSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({
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

      // Fetch Ledgers
      const resLed = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );
      if (resLed.data) {
        setLedgers(resLed.data);
      }
    } catch (err) {
      console.error("Error loading filters:", err);
    }
  };

  const handleApply = () => {
    handleSubmit(formData);
    handleClose();
  };

  const ledgerOptions = ledgers.map((l) => ({
    label: `${l.Party} (${l.Type})`,
    value: l.Party
  }));

  return (
    <Modal show={show} onHide={handleClose} centered size="sm" className="search-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Vehicle Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Vehicle</Form.Label>
              <Select
                options={ledgerOptions}
                isClearable
                placeholder="Select Vehicle"
                value={ledgerOptions.find(opt => opt.value === formData.Vehicle) || null}
                onChange={(selected: any) => setFormData((prev: any) => ({ ...prev, Vehicle: selected ? selected.value : "" }))}
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
                onChange={(selected: any) => setFormData((prev: any) => ({ ...prev, Material: selected ? selected.value : "" }))}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Party </Form.Label>
              <Select
                options={ledgerOptions}
                isClearable
                placeholder="Select Party"
                value={ledgerOptions.find(opt => opt.value === formData.Party) || null}
                onChange={(selected: any) => setFormData((prev: any) => ({ ...prev, Party: selected ? selected.value : "" }))}
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
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, FromDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.ToDate}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, ToDate: e.target.value }))}
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

export default DCSlipsSearch;
