import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import axios from "axios";
import Select from "react-select";
interface Ledger {
  Party: string;
  Type: string;
}

interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const SalesStatementSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Sales", "Contractor Statement");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Party: "",
    Material: "",
    FromDate: "",
    ToDate: "",
  });

  const [parties, setParties] = useState<Ledger[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems");
        if (!id) return;

        // Fetch Parties
        const partyRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );
        const allParties = (Array.isArray(partyRes.data) ? partyRes.data : []);
        setParties(allParties);

        // Fetch Materials
        const materialRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
        );
        if (Array.isArray(materialRes.data)) {
          setMaterials(materialRes.data.map((m: any) => m.Material || ""));
        }
      } catch (err) {
        console.error("Failed to load search data", err);
      }
    };

    if (show) fetchData();
  }, [show]);

  const partyOptions = parties.map((p) => ({
    label: p.Party,
    value: p.Party,
  }));

  const materialOptions = materials.map((m) => ({
    label: m,
    value: m,
  }));

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="sm"
      className="search-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Party</Form.Label>
                <Select
                  options={partyOptions}
                  placeholder="Select Party"
                  isClearable
                  value={
                    partyOptions.find(
                      (opt) => opt.value === formData.Party
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Party: selected ? selected.value : "",
                    })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Material</Form.Label>
                <Select
                  options={materialOptions}
                  placeholder="Select Material"
                  isClearable
                  value={
                    materialOptions.find(
                      (opt) => opt.value === formData.Material
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Material: selected ? selected.value : "",
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Select Date Range</Form.Label>
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
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button
          variant="outline-warning"
          className="px-4 fw-semibold"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          className="px-4 fw-semibold"
          onClick={() => {
            const payload = { ...formData };
            if (!payload.FromDate || !payload.ToDate) {
              payload.FromDate = moment().subtract(6, "days").format("YYYY-MM-DD");
              payload.ToDate = moment().format("YYYY-MM-DD");
            }
            handleSubmit(payload);
          }}
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SalesStatementSearch;

