import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
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
  Party: string;
  Type: string;
}

const SalesDebitorSummarySearch = ({
  show,
  handleClose,
  handleSubmit,
}: SearchModalProps) => {
  const accessDenied = checkPageAccess("Sales", "Debitor Summary");
  if (accessDenied) return accessDenied;


  const [formData, setFormData] = useState({
    Party: "",
    FromDate: "",
    ToDate: "",
  });

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchLedgers();
    }
  }, [show]);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      const data = Array.isArray(res.data) ? res.data : [];

      setLedgers(data);
    } catch (error) {
      console.error("Ledger fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const ledgerOptions = ledgers.map((ledger) => ({
    value: ledger.Party,
    label: ledger.Party,
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
          {/* Searchable Party Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>Party</Form.Label>
              <Select
                options={ledgerOptions}
                isLoading={loading}
                placeholder="Search & Select Party..."
                value={
                  ledgerOptions.find(
                    (option) => option.value === formData.Party
                  ) || null
                }
                onChange={(selected) =>
                  setFormData({
                    ...formData,
                    Party: selected ? selected.value : "",
                  })
                }
                isClearable
              />
            </Form.Group>
          </Row>

          {/* Date Range */}
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

export default SalesDebitorSummarySearch;

