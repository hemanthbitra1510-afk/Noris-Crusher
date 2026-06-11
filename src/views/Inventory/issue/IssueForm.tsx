import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button, Form, Row, Col, Alert } from "react-bootstrap";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
interface MaterialIssueFormProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
    initialData?: any;
}

interface Ledger {
    ID: string;
    Party: string;
    Type: string;
    Status: string;
}

const MaterialIssueForm = ({ show, onClose, onSubmit, initialData }: MaterialIssueFormProps) => {
    const accessDenied = checkPageAccess("Inventory", "Issue");
    if (accessDenied) return accessDenied;

    const [formData, setFormData] = useState({
        Payee: sessionStorage.getItem("materialIssue_Payee") || "",
        Material: "",
        Description: "",
        Qty: "",
        Rate: "",
        Amount: "",
        IssuedTo: sessionStorage.getItem("materialIssue_IssuedTo") || "",
        Date1: sessionStorage.getItem("materialIssue_Date1") || dayjs().format("DD-MM-YYYY"),
        Ledger: sessionStorage.getItem("materialIssue_Ledger") || "",
        Reading: sessionStorage.getItem("materialIssue_Reading") || "",
    });

    const indianFormatter = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });


    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [spares, setSpares] = useState<string[]>([]);
    const [ledgerOptions, setLedgerOptions] = useState<string[]>([]);

    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                if (!id) return;

                const res = await fetch(
                    `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=Ledgers`
                );
                const data = await res.json();
                const list = Array.isArray(data)
                    ? data.map((item: any) => item.Ledger || item.Party || item.name || "")
                    : [];
                setLedgerOptions(list.filter(Boolean));
            } catch (err) {
                console.error("Ledger fetch failed", err);
            }
        };
        fetchLedgers();
    }, []);

    useEffect(() => {
        const fetchSpares = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                if (!id) return;

                const res = await fetch(
                    `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MySpares`
                );
                const data = await res.json();

                const sparesList = Array.isArray(data)
                    ? data.map((item: any) => item.Spares || item.Material || "")
                    : [];

                setSpares(sparesList.filter(Boolean));
            } catch (err) {
                console.error("Spares fetch failed", err);
            }
        };

        fetchSpares();
    }, []);

    const [partyList, setPartyList] = useState<any[]>([]);

    useEffect(() => {
        const fetchParties = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                if (!id) return;

                const [resPayee, resIssueTo] = await Promise.all([
                    fetch(`https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=Payee`),
                    fetch(`https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=IssueTo`)
                ]);

                const [payees, issueTos] = await Promise.all([
                    resPayee.json(),
                    resIssueTo.json()
                ]);

                const combined = [
                    ...(Array.isArray(payees) ? payees : []),
                    ...(Array.isArray(issueTos) ? issueTos : [])
                ];

                // Extract and unique names, keeping type information if available
                const uniquePartiesMap = new Map();
                combined.forEach(p => {
                    const name = (p.Payee || p.IssuedTo || p.IssueTo || p.Name || p.Party || "").trim();
                    if (name) {
                        if (!uniquePartiesMap.has(name) || (!uniquePartiesMap.get(name).type && p.Type)) {
                            uniquePartiesMap.set(name, {
                                name: name,
                                type: p.Type || ""
                            });
                        }
                    }
                });

                setPartyList(Array.from(uniquePartiesMap.values()));
            } catch (err) {
                console.error("Party fetch failed", err);
            }
        };

        fetchParties();
    }, []);

    // Sync persistent fields to sessionStorage
    useEffect(() => {
        if (!initialData) {
            sessionStorage.setItem("materialIssue_Payee", formData.Payee);
            sessionStorage.setItem("materialIssue_IssuedTo", formData.IssuedTo);
            sessionStorage.setItem("materialIssue_Date1", formData.Date1);
            sessionStorage.setItem("materialIssue_Ledger", formData.Ledger);
            sessionStorage.setItem("materialIssue_Reading", formData.Reading);
        }
    }, [formData.Payee, formData.IssuedTo, formData.Date1, formData.Ledger, formData.Reading, initialData]);



    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                Qty: initialData.Qty?.toString() ?? "",
                Rate: initialData.Rate?.toString() ?? "",
                Amount: initialData.Amount?.toString() ?? "",
            });
        }
    }, [initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const nextState = { ...prev, [name]: value };

            if (name === "Qty" || name === "Rate") {
                const qty = Number(nextState.Qty || 0);
                const rate = Number(nextState.Rate || 0);
                nextState.Amount = (qty * rate).toString();
            }

            return nextState;
        });

        // Clear error for this field on change
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const fetchRateByMaterial = async (material: string) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !material) return;

            const res = await fetch(
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=SparesRate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        Spares: material, // ✅ MATERIAL AS PAYLOAD
                    }),
                }
            );

            const data = await res.json();

            const rate = Array.isArray(data) ? data[0]?.Rate : data?.Rate;

            if (rate !== undefined && rate !== null) {
                setFormData((prev) => {
                    const qty = Number(prev.Qty || 0);
                    return {
                        ...prev,
                        Rate: rate.toString(),
                        Amount: (qty * Number(rate)).toString(),
                    };
                });
            }
        } catch (err) {
            console.error("Rate fetch failed", err);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.Material.trim()) newErrors.Material = "Material is required";
        if (!formData.Qty || Number(formData.Qty) <= 0) newErrors.Qty = "Quantity must be greater than 0";
        if (!formData.Rate || Number(formData.Rate) < 0) newErrors.Rate = "Rate is required";
        if (!formData.IssuedTo.trim()) newErrors.IssuedTo = "Receiver is required";
        if (!formData.Date1.trim()) newErrors.Date1 = "Date is required";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            await onSubmit(formData);

            // If in Add mode, keep header fields but clear transient item fields
            if (!initialData) {
                setFormData(prev => ({
                    ...prev,
                    Material: "",
                    Qty: "",
                    Rate: "",
                    Amount: "",
                    Description: ""
                }));
            }
        }
    };
    useEffect(() => {
        validateForm();
    }, [formData]);
    return (
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "750px" }}>
            <OffcanvasHeader closeButton>
                <h5 className="mb-0 text-danger">{initialData ? "Edit Material Issue" : "Add Material Issue"}</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                <Form>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Issue To</Form.Label>

                                <CreatableSelect
                                    options={partyList.map(p => ({
                                        value: p.name,
                                        label: p.name,
                                        type: p.type
                                    }))}

                                    value={
                                        formData.Payee
                                            ? {
                                                value: formData.Payee,
                                                label: formData.Payee
                                            }
                                            : null
                                    }

                                    onChange={(selectedOption: any) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            Payee: selectedOption?.value || "",
                                            Ledger: selectedOption?.type || ""
                                        }));

                                        setErrors(prev => ({ ...prev, Payee: "" }));
                                    }}

                                    placeholder="Type or Select Issue To"
                                    isClearable
                                    classNamePrefix="react-select"
                                />

                                {errors.Payee && (
                                    <div className="text-danger mt-1">{errors.Payee}</div>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Material</Form.Label>
                                <Select
                                    options={spares.map((s) => ({
                                        value: s,
                                        label: s,
                                    }))}

                                    value={
                                        formData.Material
                                            ? { value: formData.Material, label: formData.Material }
                                            : null
                                    }

                                    onChange={(selectedOption: any) => {
                                        const value = selectedOption?.value || "";

                                        setFormData((prev) => ({
                                            ...prev,
                                            Material: value,
                                        }));

                                        setErrors((prev) => ({ ...prev, Material: "" }));

                                        fetchRateByMaterial(value); // ✅ CALL API WITH MATERIAL
                                    }}

                                    placeholder="Search Material..."
                                    isClearable
                                    isSearchable
                                    classNamePrefix="react-select"
                                />
                                <Form.Control.Feedback type="invalid">{errors.Material}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Reading</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Reading"
                                    value={formData.Reading}
                                    onChange={handleChange}
                                    onFocus={(e: any) => e.target.select()}
                                    placeholder="Enter reading"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Date</Form.Label>
                                <CommonDatePicker
                                    value={formData.Date1 ? dayjs(formData.Date1, "DD-MM-YYYY") : null}
                                    format="DD-MM-YYYY"
                                    onChange={(date) => {
                                        // store formatted string in formData
                                        setFormData((prev) => ({
                                            ...prev,
                                            Date1: date ? dayjs(date).format("DD-MM-YYYY") : "",
                                        }));

                                        // clear error if any
                                        setErrors((prev) => ({ ...prev, Date1: "" }));
                                    }}
                                    placeholder="dd-mm-yyyy"
                                />

                                {errors.Date1 && <div className="text-danger mt-1">{errors.Date1}</div>}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Ledger</Form.Label>
                                <CreatableSelect
                                    options={ledgerOptions.map((l) => ({
                                        value: l,
                                        label: l,
                                    }))}
                                    value={
                                        formData.Ledger
                                            ? { value: formData.Ledger, label: formData.Ledger }
                                            : null
                                    }
                                    onChange={(selectedOption: any) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            Ledger: selectedOption?.value || "",
                                        }));
                                    }}
                                    placeholder="Type or Select Ledger"
                                    isClearable
                                    classNamePrefix="react-select"
                                />
                            </Form.Group>
                        </Col>

                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    name="Description"
                                    value={formData.Description}
                                    onChange={handleChange}
                                    onFocus={(e: any) => e.target.select()}
                                    placeholder="Enter description"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Qty"
                                    value={formData.Qty}
                                    onChange={handleChange}
                                    onFocus={(e: any) => e.target.select()}
                                    placeholder="0"
                                    isInvalid={!!errors.Qty}
                                />
                                <Form.Control.Feedback type="invalid">{errors.Qty}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Rate</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Rate"
                                    value={formData.Rate}
                                    onChange={handleChange}
                                    onFocus={(e: any) => e.target.select()}
                                    placeholder="0.00"
                                    isInvalid={!!errors.Rate}
                                />
                                <Form.Control.Feedback type="invalid">{errors.Rate}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Amount</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="Amount"
                                    value={
                                        formData.Amount
                                            ? indianFormatter.format(Number(formData.Amount))
                                            : ""
                                    }
                                    readOnly
                                    placeholder="Auto calculated"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Receiver</Form.Label>

                                <CreatableSelect
                                    options={partyList.map(p => ({
                                        value: p.name,
                                        label: p.name,
                                    }))}
                                    value={
                                        formData.IssuedTo
                                            ? { value: formData.IssuedTo, label: formData.IssuedTo }
                                            : null
                                    }
                                    onChange={(selectedOption: any) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            IssuedTo: selectedOption?.value || ""
                                        }));
                                        setErrors(prev => ({ ...prev, IssuedTo: "" }));
                                    }}
                                    placeholder="Type or Select Receiver"
                                    isClearable
                                    isSearchable
                                    classNamePrefix="react-select"
                                />

                                {errors.IssuedTo && (
                                    <div className="text-danger mt-1">{errors.IssuedTo}</div>
                                )}
                            </Form.Group>
                        </Col>

                    </Row>

                    {/* <Row className="mb-3">
                        
                    </Row> */}
                </Form>

                <div className="d-flex justify-content-end mt-3">
                    <Button variant="secondary" className="me-2" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {initialData ? "Update" : "Save"}
                    </Button>
                </div>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default MaterialIssueForm;
