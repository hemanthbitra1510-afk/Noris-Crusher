import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import axios from "axios";
import Select from "react-select";
import { useToast } from "../../../components/reuse-components/Toast";

interface ModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData: any | null;
}

const ModalAdvanceEmployee = ({ show, onClose, onSuccess, initialData }: ModalProps) => {
    const [formData, setFormData] = useState({
        Party: "",
        LedgerFamily: "",
        Amount: "",
        Description: "",
        PaymentMode: "",
        Date: dayjs().format("DD-MM-YYYY"),
        Vochure: "Advance",
        IDS: ""
    });

    const [employees, setEmployees] = useState<any[]>([]);
    const [paymentModes, setPaymentModes] = useState<{ Bank: string; AccNo: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const showToast = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            // Fetch Employees
            const empRes = await axios.get(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${id}&TableName=MyEmployees`
            );
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);

            // Fetch Bank Details for Payment Mode
            const bankRes = await axios.get(
                `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetBankDetails`
            );
            setPaymentModes(Array.isArray(bankRes.data) ? bankRes.data : []);

        } catch (err) {
            console.error("Failed to fetch data", err);
            showToast("Error", "Failed to load master data", "danger");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (show) {
            fetchData();
        }
    }, [show, fetchData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                Party: initialData.Names || initialData.Party || "",
                LedgerFamily: initialData.Under || initialData.LedgerFamily || "",
                Amount: initialData.DebitAmount || initialData.Amount || "",
                Description: initialData.Particular || initialData.Description || "",
                PaymentMode: initialData.Bank || initialData.PaymentMode || "",
                Date: initialData.Date1 || initialData.Date || dayjs().format("DD-MM-YYYY"),
                Vochure: initialData.Vochure || initialData.LedgerType || "Advance",
                IDS: initialData.ID1 || initialData.ID || ""
            });
        } else {
            setFormData({
                Party: "",
                LedgerFamily: "",
                Amount: "",
                Description: "",
                PaymentMode: "",
                Date: dayjs().format("DD-MM-YYYY"),
                Vochure: "Advance",
                IDS: ""
            });
        }
    }, [initialData, show]);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            // ✅ Remove account number from "BankName (1234)" for the backend if needed
            const cleanedPaymentMode = formData.PaymentMode
                ?.replace(/\s*\(.*?\)\s*/g, "")
                ?.trim();

            const payload = {
                Party: formData.Party,
                LedgerFamily: formData.LedgerFamily,
                Vochure: formData.Vochure,
                Date: formData.Date,
                Description: formData.Description,
                PaymentMode: cleanedPaymentMode,
                Bank: cleanedPaymentMode,           // ✅ Also send as Bank for consistency
                Amount: formData.Amount,
                ...(initialData && { IDS: formData.IDS })
            };

            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPaymentsSave`,
                payload
            );

            showToast("Success", "Advance recorded successfully!", "success");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save advance", err);
            showToast("Error", "Failed to record advance. Please try again.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const employeeOptions = employees.map(emp => ({
        value: emp.Employee,
        label: emp.Employee,
        aadhar: emp.Aadhar
    }));

    const paymentOptions = paymentModes.map(pm => ({
        value: `${pm.Bank} (${pm.AccNo})`,
        label: `${pm.Bank} (${pm.AccNo})`
    }));

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "80%" }}>
            <OffcanvasHeader closeButton className="border-bottom">
                <h4 className="fw-bold text-primary mb-0">
                    {initialData ? "Edit Employee Advance" : "Record Employee Advance"}
                </h4>
            </OffcanvasHeader>

            <OffcanvasBody>
                <Form onSubmit={handleSubmit} className="p-2">
                    <h6 className="text-uppercase text-muted mb-3 fw-bold small">Employee & Context</h6>
                    <Row>
                        <Col md={12} className="mb-3">
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

                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Employee Name</Form.Label>
                                <Select
                                    options={employeeOptions}
                                    value={employeeOptions.find(opt => opt.value === formData.Party) || null}
                                    onChange={(selected: any) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            Party: selected?.value || "",
                                            IDS: selected?.aadhar || "" // Using Aadhar as IDS
                                        }))
                                    }
                                    placeholder="Search Employee..."
                                    isClearable
                                    isLoading={loading}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Voucher Type</Form.Label>
                                <Form.Select
                                    name="Vochure"
                                    value={formData.Vochure}
                                    onChange={handleChange}
                                    className="rounded-3"
                                >
                                    <option value="Advance">Advance</option>
                                    <option value="OT">OT</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Sub-Ledger (Family)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="LedgerFamily"
                                    value={formData.LedgerFamily}
                                    onChange={handleChange}
                                    placeholder="Example: Staff / Driver / Worker"
                                    className="rounded-3"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="text-uppercase text-muted mb-3 mt-4 fw-bold small">Payment Details</h6>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Amount"
                                    value={formData.Amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="rounded-3"
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Payment Mode</Form.Label>
                                <Select
                                    options={paymentOptions}
                                    value={
                                        paymentOptions.find(opt => opt.value === formData.PaymentMode) ||
                                        paymentOptions.find(opt => opt.value.split(" (")[0] === formData.PaymentMode) ||
                                        null
                                    }
                                    onChange={(selected) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            PaymentMode: selected?.value || "",
                                        }))
                                    }
                                    placeholder="Select Bank..."
                                    isClearable
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label className="fw-semibold">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="Description"
                                    value={formData.Description}
                                    onChange={handleChange}
                                    placeholder="Enter details about this advance..."
                                    className="rounded-3"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <Button variant="light" className="me-2 px-4 rounded-pill" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button variant="primary" className="px-5 rounded-pill shadow-sm" type="submit" disabled={saving || !formData.Party}>
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Saving...
                                </>
                            ) : (
                                initialData ? "Update Advance" : "Save Advance"
                            )}
                        </Button>
                    </div>
                </Form>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default ModalAdvanceEmployee;
