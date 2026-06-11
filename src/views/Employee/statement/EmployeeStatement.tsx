import { useState, useEffect, useCallback } from "react";
import ListComponent from "../../../components/reuse-components/listComponent";
import axios from "axios";
import Select from "react-select";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";

interface StatementRow {
    ID: string | number;
    date: string;
    description: string;
    credit: number;
    debit: number;
    balance: number;
}

const defaultData: StatementRow[] = [
    { ID: 1, date: "01-03-2026", description: "Opening Balance", credit: 0, debit: 0, balance: 15000 },
    { ID: 2, date: "10-03-2026", description: "Advance Given", credit: 0, debit: 5000, balance: 10000 },
    { ID: 3, date: "20-03-2026", description: "Adjusted in Salary", credit: 5000, debit: 0, balance: 15000 },
];

const EmployeeStatement = () => {
    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" as const },
        { label: "Date", key: "date", dataType: "string" as const },
        { label: "Description", key: "description", dataType: "string" as const },
        { label: "Credit", key: "credit", dataType: "number" as const },
        { label: "Debit", key: "debit", dataType: "number" as const },
        { label: "Balance", key: "balance", dataType: "number" as const },
    ];

    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
    const [dealsData, setDealsData] = useState<StatementRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal Form States
    const [showModal, setShowModal] = useState(false);
    const [editRow, setEditRow] = useState<StatementRow | null>(null);
    const [formData, setFormData] = useState({
        date: dayjs().format("DD-MM-YYYY"),
        description: "",
        credit: "0",
        debit: "0",
        balance: "15000" // For opening balance initial entry
    });

    // Fetch Employees on Mount
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                const res = await axios.get(
                    `https://norisapi.noris.in/Crusher/Employee.php?ID=${id}&TableName=MyEmployees`
                );
                const list = Array.isArray(res.data) ? res.data : [];
                setEmployees(list);

                // Default select first employee if available to enhance user experience
                if (list.length > 0) {
                    setSelectedEmp(list[0]);
                }
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };

        fetchEmployees();
    }, []);

    // Recalculate Balance Function
    const recalculateBalances = (entries: StatementRow[]) => {
        const sorted = [...entries].sort((a, b) => {
            const dateA = dayjs(a.date, "DD-MM-YYYY");
            const dateB = dayjs(b.date, "DD-MM-YYYY");
            return dateA.isAfter(dateB) ? 1 : -1;
        });

        let runningBal = 0;
        return sorted.map((item, index) => {
            if (index === 0) {
                if (item.description === "Opening Balance") {
                    runningBal = Number(item.balance || 0);
                } else {
                    runningBal = Number(item.credit || 0) - Number(item.debit || 0);
                }
            } else {
                runningBal = runningBal - Number(item.debit || 0) + Number(item.credit || 0);
            }
            return { ...item, balance: runningBal };
        });
    };

    // Load Statement Data when selected employee changes
    useEffect(() => {
        if (!selectedEmp) {
            setDealsData([]);
            return;
        }

        const employeeName = selectedEmp.Employee;
        const savedData = localStorage.getItem(`employee_statement_${employeeName}`);

        if (savedData) {
            try {
                setDealsData(JSON.parse(savedData));
            } catch (e) {
                console.error("Error parsing saved statement data", e);
                setDealsData(recalculateBalances(defaultData));
            }
        } else {
            // Set and persist defaultData recalculated
            const initialRecalculated = recalculateBalances(defaultData);
            setDealsData(initialRecalculated);
            localStorage.setItem(`employee_statement_${employeeName}`, JSON.stringify(initialRecalculated));
        }
    }, [selectedEmp]);

    // Save and Persist Data Helper
    const saveAndPersist = (updatedRows: StatementRow[]) => {
        const recalculated = recalculateBalances(updatedRows);
        setDealsData(recalculated);

        if (selectedEmp) {
            const employeeName = selectedEmp.Employee;
            localStorage.setItem(`employee_statement_${employeeName}`, JSON.stringify(recalculated));
        }
    };

    // Add Button Handler
    const onAddClick = () => {
        setEditRow(null);
        setFormData({
            date: dayjs().format("DD-MM-YYYY"),
            description: "",
            credit: "0",
            debit: "0",
            balance: "0"
        });
        setShowModal(true);
    };

    // Edit Button Handler
    const handleEdit = (row: any) => {
        const typedRow = row as StatementRow;
        setEditRow(typedRow);
        setFormData({
            date: typedRow.date,
            description: typedRow.description,
            credit: String(typedRow.credit || 0),
            debit: String(typedRow.debit || 0),
            balance: String(typedRow.balance || 0)
        });
        setShowModal(true);
    };

    // Delete Button Handler
    const handleDelete = (row: any) => {
        const typedRow = row as StatementRow;
        if (window.confirm(`Are you sure you want to delete the entry "${typedRow.description}"?`)) {
            const updated = dealsData.filter(item => item.ID !== typedRow.ID);
            saveAndPersist(updated);
        }
    };

    // Form Change Handler
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Form Submit Handler
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const creditNum = parseFloat(formData.credit) || 0;
        const debitNum = parseFloat(formData.debit) || 0;
        const balNum = parseFloat(formData.balance) || 0;

        if (editRow) {
            // Edit existing entry
            const updated = dealsData.map(item => {
                if (item.ID === editRow.ID) {
                    return {
                        ...item,
                        date: formData.date,
                        description: formData.description,
                        credit: creditNum,
                        debit: debitNum,
                        balance: formData.description === "Opening Balance" ? balNum : item.balance
                    };
                }
                return item;
            });
            saveAndPersist(updated);
        } else {
            // Add new entry
            const newEntry: StatementRow = {
                ID: Date.now(),
                date: formData.date,
                description: formData.description,
                credit: creditNum,
                debit: debitNum,
                balance: formData.description === "Opening Balance" ? balNum : 0
            };
            saveAndPersist([...dealsData, newEntry]);
        }

        setShowModal(false);
    };

    // Employee Dropdown Options
    const employeeOptions = employees.map(emp => ({
        value: emp,
        label: `${emp.Employee} (${emp.Designation || "Employee"})`
    }));

    return (
        <div className="page-wrapper">
            <div className="content p-2">
                {/* Search & Selector Card */}
                <div className="card shadow-sm mb-3 rounded-3">
                    <div className="card-body p-3">
                        <Row className="align-items-center">
                            <Col md={4} className="mb-2 mb-md-0">
                                <Form.Label className="fw-bold text-dark small mb-1">Select Employee</Form.Label>
                                <Select
                                    options={employeeOptions}
                                    value={selectedEmp ? { value: selectedEmp, label: `${selectedEmp.Employee} (${selectedEmp.Designation || "Employee"})` } : null}
                                    onChange={(selected: any) => setSelectedEmp(selected?.value || null)}
                                    placeholder="Search and select employee..."
                                    isClearable
                                />
                            </Col>
                            {selectedEmp && (
                                <Col md={8} className="text-md-end mt-2 mt-md-0">
                                    <div className="d-inline-block bg-light p-2 px-3 rounded-pill text-dark border">
                                        <span className="fw-semibold small">Designation:</span> <span className="me-3 small">{selectedEmp.Designation || "N/A"}</span>
                                        <span className="fw-semibold small">Contact:</span> <span className="small">{selectedEmp.Contact || "N/A"}</span>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </div>
                </div>

                {selectedEmp ? (
                    <ListComponent
                        title={`Employee Statement - ${selectedEmp.Employee}`}
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={dealsData}
                        loading={loading}
                        onAddClick={onAddClick}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                ) : (
                    <div className="card shadow-sm border text-center p-5 rounded-3 bg-white">
                        <div className="py-4">
                            <i className="bi bi-person-badge text-muted" style={{ fontSize: "4rem" }}></i>
                            <h5 className="mt-3 fw-bold text-dark">No Employee Selected</h5>
                            <p className="text-muted small mx-auto" style={{ maxWidth: "350px" }}>
                                Please select an employee from the dropdown above to view, manage, and edit their statement.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Entry Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold text-primary">
                        {editRow ? "Edit Statement Entry" : "Add Statement Entry"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        <Row className="mb-3">
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Date</Form.Label>
                                    <CommonDatePicker
                                        value={formData.date ? dayjs(formData.date, "DD-MM-YYYY") : null}
                                        format="DD-MM-YYYY"
                                        onChange={(date) =>
                                            setFormData({
                                                ...formData,
                                                date: date ? dayjs(date).format("DD-MM-YYYY") : "",
                                            })
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label className="fw-semibold">Description</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        placeholder="Example: Advance, Adjusted in Salary, OT Pay, Bonus"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            {formData.description === "Opening Balance" ? (
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Initial Balance</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="balance"
                                            value={formData.balance}
                                            onChange={handleFormChange}
                                            placeholder="Enter initial balance"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            ) : (
                                <>
                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold">Credit (Additions)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="credit"
                                                value={formData.credit}
                                                onChange={handleFormChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6} className="mb-3">
                                        <Form.Group>
                                            <Form.Label className="fw-semibold">Debit (Deductions / Advances)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="debit"
                                                value={formData.debit}
                                                onChange={handleFormChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}
                        </Row>

                        <div className="d-flex justify-content-end gap-2 border-top pt-3">
                            <Button variant="light" className="px-4" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" className="px-4" type="submit">
                                {editRow ? "Update Entry" : "Save Entry"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default EmployeeStatement;
