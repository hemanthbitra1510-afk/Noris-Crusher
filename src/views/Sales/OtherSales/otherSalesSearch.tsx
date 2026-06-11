import { useState, useEffect } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import axios from "axios";
import Select from "react-select";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import moment from "moment";

interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

interface Ledger {
  Party: string;
  Type: string;
}

const parseMalformedJsonArray = (rawData: any): any[] => {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData;
  if (typeof rawData !== "string") return [];

  const trimmed = rawData.trim();
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonSub = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(jsonSub);
    } catch (e) {
      console.error("Failed to parse extracted JSON substring:", e);
    }
  }

  // Fallback: try parsing the whole thing
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Fallback JSON parsing failed:", e);
    return [];
  }
};

const OtherSalesSearch = ({
  show,
  handleClose,
  handleSubmit,
}: SearchModalProps) => {
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
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`,
        { transformResponse: [(data) => data] }
      );

      const parsed = parseMalformedJsonArray(res.data);
      const data = Array.isArray(parsed) ? parsed : [];
      const normalizedData = data
        .filter((ledger) => ledger.Party && ledger.Party.trim() !== "")
        .map((ledger) => ({
          Party: ledger.Party.trim(),
          Type: ledger.Type ? ledger.Type.trim() : ""
        }));
      setLedgers(normalizedData);
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
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  menu: (base) => ({ ...base, zIndex: 9999 })
                }}
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

export default OtherSalesSearch;
