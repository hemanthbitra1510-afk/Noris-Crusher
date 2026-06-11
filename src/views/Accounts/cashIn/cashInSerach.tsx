import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import Select from "react-select";
interface Ledger {
  Party: string;
  Type: string;
}

interface PaymentMode {
  Bank: string;
  AccNo: string;
}

interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const CashInSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Accounts", "Cash In");
  if (accessDenied) return accessDenied;

  const [ledgerData, setLedgerData] = useState<Ledger[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [formData, setFormData] = useState({
    Party: "",
    PaymentMode: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  const fetchLedgers = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setLedgerData(data);
    } catch (err) {
      console.error("Error fetching ledger list:", err);
    }
  }, []);

  const fetchPaymentModes = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetBankDetails`
      );

      setPaymentModes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch payment modes", err);
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchLedgers();
      fetchPaymentModes();
    }
  }, [show, fetchLedgers, fetchPaymentModes]);

  const partyOptions = ledgerData.map((l) => ({
    value: l.Party,
    label: l.Party,
  }));

  const paymentOptions = paymentModes.map((p) => ({
    value: `${p.Bank} (${p.AccNo})`,
    label: `${p.Bank} (${p.AccNo})`,
  }));

  return (
    <Modal show={show} onHide={handleClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row className="mb-3">

            <Col md={6}>
              <Form.Group>
                <Form.Label>Party / Ledger</Form.Label>
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
                <Form.Label>Payment Mode</Form.Label>
                <Select
                  options={paymentOptions}
                  placeholder="Select Payment Mode"
                  isClearable
                  value={
                    paymentOptions.find(
                      (opt) => opt.value === formData.PaymentMode
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      PaymentMode: selected ? selected.value : "",
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
                  onChange={(from, to) =>
                    setFormData({ ...formData, FromDate: from, ToDate: to })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>

        <Button variant="primary" onClick={() => {
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

export default CashInSearch;

