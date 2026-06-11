import { checkPageAccess } from "../../../utils/permission";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import axios from "axios";
import Select from "react-select";
interface ModalProps {
  show: boolean;
  onClose: () => void;
  handleSubmit1: (formData: any) => void;
  initialData: any | null;
}

const CashInForm = ({ show, onClose, handleSubmit1, initialData }: ModalProps) => {
  const [formData, setFormData] = useState({
    Party: "",
    LedgerFamily: "",
    Amount: "",
    Description: "",
    PaymentMode: "",
    Date: dayjs().format("DD-MM-YYYY"),
    Txn: "",
    Vochure: "",
  });

  const [myVouchers, setMyVouchers] = useState<{ VoucherType: string; Typed: string }[]>([]);

  const [ledgers, setLedgers] = useState<{ Party: string; Type: string }[]>([]);
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        setLedgers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch ledgers", err);
      }
    };

    fetchLedgers();
  }, []);

  const [voucherTypes, setVoucherTypes] = useState<{ Party: string; Type: string }[]>([]);

  useEffect(() => {
    const fetchVoucherTypes = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        const allowedTypes = [
          "Sales",
          "Loan",
          "Rental",
          "Interest",
          "Other Income",
          "Capital",
        ];

        const filtered = Array.isArray(res.data)
          ? res.data.filter(
            (l: any) =>
              allowedTypes.includes(l.Type)
          )
          : [];

        setVoucherTypes(filtered);
      } catch (err) {
        console.error("Failed to fetch voucher types", err);
      }
    };

    fetchVoucherTypes();
  }, []);

  useEffect(() => {
    const fetchMyVouchers = async () => {
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
    };
    fetchMyVouchers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        Party: initialData.Party || "",
        LedgerFamily: initialData.LedgerFamily || "",
        Amount: initialData.DebitAmount || "",
        Description: initialData.Description || "",
        PaymentMode: initialData.PaymentMode || "",
        Date: initialData.Date1 || "",
        Txn: initialData.Txn || "",
        Vochure: initialData.Vochure || initialData.VoucherType || initialData.VochureType || initialData.Voucher || "",
      });
    } else {
      setFormData({
        Party: "",
        LedgerFamily: "",
        Amount: "",
        Description: "",
        PaymentMode: "",
        Date: dayjs().format("DD-MM-YYYY"),
        Txn: "",
        Vochure: "",
      });
    }
  }, [initialData]);

  const [paymentModes, setPaymentModes] = useState<
    { Bank: string; AccNo: string }[]
  >([]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetBankDetails`
        );

        setPaymentModes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch payment modes", err);
      }
    };

    fetchPaymentModes();
  }, []);

  const accessDenied = checkPageAccess("Accounts", "Cash In");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    handleSubmit1(formData);
  };

  const partyOptions = [
    ...Array.from(new Set(ledgers.map((l) => l.Party)))
      .filter(Boolean)
      .map((party) => ({
        value: party,
        label: party,
      })),
    { value: "__other__", label: "Other" },
  ];

  const paymentOptions = paymentModes.map((p) => ({
    value: `${p.Bank} (${p.AccNo})`,
    label: `${p.Bank} (${p.AccNo})`,
  }));

  if (accessDenied) return accessDenied;

  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <OffcanvasHeader closeButton>
        <h4 className="fw-bold text-dark">
          {initialData ? "Edit Cash In Entry" : "Add Cash In Entry"}
        </h4>
      </OffcanvasHeader>

      <OffcanvasBody>
        <Form onSubmit={handleSubmit}>

          {/* SECTION: PARTY DETAILS */}
          <h6 className="text-uppercase text-muted mb-3">Party Details</h6>

          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Date</Form.Label>
                <CommonDatePicker
                  value={formData.Date ? dayjs(formData.Date, "DD-MM-YYYY") : null}
                  format="DD-MM-YYYY"
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      Date: date ? dayjs(date).format("DD-MM-YYYY") : "",
                    })
                  }
                />
              </Form.Group>
            </Col>


            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Voucher Type</Form.Label>
                <Form.Select
                  name="Vochure"
                  value={formData.Vochure}
                  onChange={handleChange}
                  className="rounded-3"
                >
                  <option value="">Select Voucher Type</option>
                  <option value="Sales Amount">Sales Amount</option>
                  <option value="Service Charges">Service Charges</option>
                  <option value="Transportation Charges">Transportation Charges</option>
                  <option value="Commission Received">Commission Received</option>
                  <option value="Interest Received">Interest Received</option>
                  <option value="Rent Received">Rent Received</option>
                  <option value="Scrap Sales">Scrap Sales</option>

                  {voucherTypes.map((v, index) => (
                    <option key={index} value={v.Type}>
                      {v.Type}
                    </option>
                  ))}
                  {myVouchers
                    .filter(v => v.Typed === "Receipt" || v.Typed === "Both")
                    .map((v, index) => (
                      <option key={`custom-${index}`} value={v.VoucherType}>
                        {v.VoucherType}
                      </option>
                    ))}
                </Form.Select>

              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Party (Ledger)</Form.Label>
                <Select
                  options={partyOptions}
                  value={partyOptions.find(opt => opt.value === formData.Party) || null}
                  onChange={(selected) =>
                    setFormData(prev => ({
                      ...prev,
                      Party: selected?.value || ""
                    }))
                  }
                  placeholder="Select or Search Debitor"
                  isClearable
                />


              </Form.Group>
            </Col>

            <Col md={12} className="mt-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Sub-Ledger</Form.Label>
                <Form.Control
                  type="text"
                  name="LedgerFamily"
                  value={formData.LedgerFamily}
                  onChange={handleChange}
                  placeholder="Example: CASH RECEIVED / SALES / OTHERS"
                  className="rounded-3"
                />
              </Form.Group>
            </Col>
          </Row>


          {/* SECTION: PAYMENT DETAILS */}
          <h6 className="text-uppercase text-muted mb-3 mt-4">Payment Details</h6>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  placeholder="Enter description or purpose"
                  className="rounded-3"
                />
              </Form.Group>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Amount</Form.Label>
                <Form.Control
                  type="number"
                  name="Amount"
                  value={formData.Amount}
                  onChange={handleChange}
                  placeholder="Enter Amount"
                  className="rounded-3"
                />
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold">Payment Mode</Form.Label>
                <Select
                  options={paymentOptions}
                  value={
                    paymentOptions.find(
                      (opt) => opt.value === formData.PaymentMode
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData((prev) => ({
                      ...prev,
                      PaymentMode: selected?.value || "",
                    }))
                  }
                  placeholder="Select or Search Payment Mode"
                  isClearable
                />


              </Form.Group>
            </Col>


          </Row>

          {/* SECTION: TRANSACTION DETAILS */}



          {/* FOOTER BUTTONS */}
          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-light border me-2 px-4"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </button>

            <button className="btn btn-primary px-4" type="submit">
              {initialData ? "Update Entry" : "Save Entry"}
            </button>
          </div>

        </Form>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default CashInForm;
