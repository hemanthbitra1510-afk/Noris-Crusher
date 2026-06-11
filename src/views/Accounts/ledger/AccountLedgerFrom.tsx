import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { Link } from "react-router-dom";
import axios from "axios";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import CommonSelect from "../../../components/common-select/commonSelect";
import { Ledger_Type, SOUTH_INDIAN_STATES } from "../../../constants/constants";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import dayjs from "dayjs";
import CommonPhoneInput from "../../../components/common-phoneInput/commonPhoneInput";
interface ModalCompaniesProps {
    show: boolean;
    onClose: () => void;
    handleSubmit1: (formData: any) => void;
    initialData: any | null;
}

interface Option {
    label: string;
    value: string;
}

const AccountLedgerForm: React.FC<ModalCompaniesProps> = ({
    show,
    onClose,

    handleSubmit1,
    initialData,
}) => {
    const [formData, setFormData] = useState({
        PartyName: "",
        Contact: "",
        Type: Ledger_Type[0]?.value || "",
        GSTin: "",
        Address: "",
        City: "",
        State: "",
        Limit: "",
        OpeningBalance: "",
        Date: "",
        Email: "",
    });
    const today = dayjs().format("DD-MM-YYYY");
    const [apiTypes, setApiTypes] = useState<Option[]>([]);

    useEffect(() => {
        const fetchLedgerTypes = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                const res = await axios.get(
                    `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgerType`
                );
                if (res.data && Array.isArray(res.data)) {
                    const formatted = res.data.map((item: any) => ({
                        value: item.LedgerType || item.code || item.name,
                        label: item.LedgerType || item.name,
                    }));
                    setApiTypes(formatted);
                }
            } catch (err) {
                console.error("Error fetching ledger types:", err);
            }
        };
        fetchLedgerTypes();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                Type: initialData.Type || Ledger_Type[0]?.value,
                State: initialData.State || initialData.state || "",
                Date: initialData.Date || "",
                Email: initialData.Email || "",
            });
        } else {
            // reset on Add
            setFormData({
                PartyName: "",
                Contact: "",
                Type: Ledger_Type[0]?.value || "",
                GSTin: "",
                Address: "",
                City: "",
                State: "",
                Limit: "",
                OpeningBalance: "",
                Date: today,
                Email: "",
            });
        }
    }, [initialData]);


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const accessDenied = checkPageAccess("Accounts", "Ledger Creation");
        if (accessDenied) return accessDenied;

        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const staticOptions: Option[] = Ledger_Type.map((item) => ({
        value: item.code,
        label: item.name,
    }));

    const options: Option[] = [...staticOptions, ...apiTypes];

    const stateOptions: Option[] = SOUTH_INDIAN_STATES.map((item) => ({
        value: item.code,
        label: item.name,
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit1(formData);
    };

    const handleGSTSearch = async () => {
        if (!formData.GSTin) return;
        try {
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/GSTIN.php?GSTIN=${formData.GSTin.trim()}`
            );

            // Assume the new API returns the object directly at res.data
            const responseData = res.data;
            const gstData = Array.isArray(responseData) ? responseData[0] : responseData;

            if (gstData && (gstData.Company || gstData.Address || gstData.State1 || gstData.tradeName || gstData.legalName || gstData.PartyName)) {
                setFormData((prev) => ({
                    ...prev,
                    PartyName: gstData.Company || gstData.tradeName || gstData.legalName || gstData.TradeName || gstData.LegalName || gstData.PartyName || prev.PartyName,
                    Address: gstData.Address || gstData.principalPlaceOfBusiness || gstData.address || prev.Address,
                    City: gstData.city || gstData.City || gstData.principalPlaceOfBusiness?.split(",")[1]?.trim() || prev.City,
                    State: gstData.State1 || gstData.state || gstData.State || prev.State,
                    Email: gstData.email || gstData.Email || prev.Email,
                    Contact: gstData.mobile || gstData.Contact || gstData.contact || prev.Contact,
                }));
            }
        } catch (err) {
            console.error("Error fetching GST data:", err);
        }
    };

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" backdrop scroll id="offcanvas_edit">
            <OffcanvasHeader closeButton>
                <h5 className="mb-0">{initialData ? "Edit Ledger" : "Add Ledger"}</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                <Form onSubmit={handleSubmit}>
                    {/* GSTIN SEARCH BAR */}
                    <div className="mb-4 p-3 border rounded bg-light">
                        <Form.Label className="fw-bold">Search GSTIN</Form.Label>
                        <div className="input-group">
                            <Form.Control
                                type="text"
                                name="GSTin"
                                placeholder="Enter GSTIN Number"
                                value={formData.GSTin}
                                onChange={handleChange}
                            />
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={handleGSTSearch}
                            >
                                <i className="ti ti-search me-1" />
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="accordion accordion-bordered" id="main_accordion2">
                        {/* BASIC INFO */}
                        <div className="accordion-item rounded mb-3">
                            <div className="accordion-header">
                                <Link
                                    to="#"
                                    className="accordion-button accordion-custom-button rounded"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#basic2"
                                >
                                    <span className="avatar avatar-md rounded me-1">
                                        <i className="ti ti-user-plus" />
                                    </span>
                                    Basic Info
                                </Link>
                            </div>
                            <div
                                className="accordion-collapse collapse show"
                                id="basic2"
                                data-bs-parent="#main_accordion2"
                            >
                                <div className="accordion-body border-top">
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ledger</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="PartyName"
                                                    value={formData.PartyName}
                                                    onChange={handleChange}
                                                    autoComplete="off"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Contact</Form.Label>
                                                <CommonPhoneInput
                                                    name="Contact"
                                                    value={formData.Contact}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Type</Form.Label>
                                                <CommonSelect
                                                    options={options}
                                                    value={options.find((opt) => opt.value === formData.Type) || null}
                                                    onChange={(selectedOption) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            Type: selectedOption?.value || "",
                                                        }))
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email ID</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="Email"
                                                    value={formData.Email}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                                <div className="accordion-body border-top">
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Opening Balance</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="OpeningBalance"
                                                    value={formData.OpeningBalance}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Credit Limit</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="Limit"
                                                    value={formData.Limit}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Date</Form.Label>
                                                <CommonDatePicker
                                                    value={
                                                        formData.Date
                                                            ? dayjs(formData.Date, "DD-MM-YYYY")
                                                            : null
                                                    }
                                                    format="DD-MM-YYYY"
                                                    onChange={(date) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            Date: date ? dayjs(date).format("DD-MM-YYYY") : "",
                                                        }))
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>

                        {/* ADDRESS INFO */}
                        <div className="accordion-item border-top rounded mb-3">
                            <div className="accordion-header">
                                <Link
                                    to="#"
                                    className="accordion-button accordion-custom-button rounded"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#address"
                                >
                                    <span className="avatar avatar-md rounded me-1">
                                        <i className="ti ti-map-pin-cog" />
                                    </span>
                                    Address Info
                                </Link>
                            </div>
                            <div
                                className="accordion-collapse collapse"
                                id="address"
                                data-bs-parent="#main_accordion2"
                            >
                                <div className="accordion-body border-top">
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Address</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="Address"
                                                    value={formData.Address}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>City</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="City"
                                                    value={formData.City}
                                                    onChange={handleChange}
                                                    autoComplete="new-password"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>State</Form.Label>
                                                <CommonSelect
                                                    options={stateOptions}
                                                    value={stateOptions.find((opt) => opt.value === formData.State)}
                                                    onChange={(selectedOption) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            State: selectedOption?.value || "",
                                                        }))
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>

                        {/* BALANCE */}

                    </div>

                    {/* Footer */}
                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-light me-2" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                </Form>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default AccountLedgerForm;

