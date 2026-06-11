import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import axios from "axios";
import Select from "react-select";
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

const ContractorSearch = ({
  show,
  handleClose,
  handleSubmit,
}: SearchModalProps) => {
  const accessDenied = checkPageAccess("Quarry", "Contractor");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Contractor: "",
    FromDate: "",
    ToDate: "",
  });

  const [contractors, setContractors] = useState<Ledger[]>([]);
  const contractorOptions = contractors.map((c) => ({
    label: c.Party,
    value: c.Party,
  }));

  // ✅ FETCH CONTRACTORS FROM MYLEDGERS
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems");
        if (!id) return;

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        const contractorOnly = (Array.isArray(res.data) ? res.data : []);

        setContractors(contractorOnly);
      } catch (err) {
        console.error("Failed to load contractors", err);
      }
    };

    if (show) fetchContractors(); // load only when modal opens
  }, [show]);

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Contractor</Form.Label>

                {/* ✅ DROPDOWN INSTEAD OF TEXT INPUT */}
                <Select
                  options={contractorOptions}
                  placeholder="Select or type contractor..."
                  isClearable
                  value={
                    contractorOptions.find(
                      (opt) => opt.value === formData.Contractor
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      Contractor: selected ? selected.value : "",
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

export default ContractorSearch;
