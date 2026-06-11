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

const CashSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Accounts", "Cash Out");
  if (accessDenied) return accessDenied;

  const [ledgerData, setLedgerData] = useState<Ledger[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    Party: "",
    PaymentMode: "",
    VoucherType: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  // Fetch ledgers on modal open
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

  const fetchEmployees = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Employee.php?ID=${id}&TableName=MyEmployees`
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employee list:", err);
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

  const fetchVoucherTypes = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );
      const allowedTypes = ["Purchase", "Loan", "Advance", "Salary", "Expense"];
      const filtered = Array.isArray(res.data)
        ? res.data.filter((l: any) => allowedTypes.includes(l.Type))
        : [];
      setVoucherTypes(filtered);
    } catch (err) {
      console.error("Failed to fetch voucher types", err);
    }
  }, []);

  const fetchMyVouchers = useCallback(async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyVouchers`,
        {}
      );
      setMyVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch my vouchers", err);
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchLedgers();
      fetchEmployees();
      fetchPaymentModes();
      fetchVoucherTypes();
      fetchMyVouchers();
    }
  }, [show, fetchLedgers, fetchEmployees, fetchPaymentModes, fetchVoucherTypes, fetchMyVouchers]);

  const partyOptions = Array.from(
    new Set([
      ...ledgerData.map((l) => l.Party),
      ...employees.map((e) => e.Employee),
    ])
  )
    .filter(Boolean)
    .map((party) => ({
      value: party,
      label: party,
    }));

  const paymentOptions = paymentModes.map((p) => ({
    value: p.Bank,
    label: `${p.Bank} (${p.AccNo})`,
  }));

  const staticVoucherOptions = [
    { value: "Salary Paid", label: "Salary Paid" },
    { value: "Electricity Bill", label: "Electricity Bill" },
    { value: "Plant Expenses", label: "Plant Expenses" },
    { value: "Site Expenses", label: "Site Expenses" },
    { value: "Businees development charges", label: "Businees development charges" },
    { value: "Land Lease", label: "Land Lease" },
    { value: "R&M Machinary", label: "R&M Machinary" },
    { value: "Diesel Expense(Crusher / RMC)", label: "Diesel Expense(Crusher / RMC)" },
    { value: "Office Rent", label: "Office Rent" },
    { value: "Repairs & Maintenance", label: "Repairs & Maintenance" },
    { value: "Interest Paid", label: "Interest Paid" },
    { value: "Purchase payment", label: "Purchase payment" },
  ];

  const fetchedVoucherOptions = voucherTypes.map((v) => ({
    value: v.Type,
    label: v.Type,
  }));

  const customVoucherOptions = myVouchers
    .filter((v) => v.Typed === "Payment" || v.Typed === "Both")
    .map((v) => ({
      value: v.VoucherType,
      label: v.VoucherType,
    }));

  const voucherOptions = [
    ...staticVoucherOptions,
    ...fetchedVoucherOptions,
    ...customVoucherOptions,
  ];

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
                <Form.Label>Voucher Type</Form.Label>
                <Select
                  options={voucherOptions}
                  placeholder="Select Voucher Type"
                  isClearable
                  value={
                    voucherOptions.find((opt) => opt.value === formData.VoucherType) ||
                    null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      VoucherType: selected ? selected.value : "",
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

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

export default CashSearch;

