import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Modal, Row, Col, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import Select from "react-select";

interface AdvanceSearchProps {
    show: boolean;
    handleClose: () => void;
    handleSubmit: (formData: any) => void;
}

const AdvanceSearch = ({ show, handleClose, handleSubmit }: AdvanceSearchProps) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        Employee: "",
        FromDate: "",
        ToDate: "",
    });

    const fetchEmployees = useCallback(async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${id}&TableName=MyEmployees`
            );
            setEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    }, []);

    useEffect(() => {
        if (show) {
            fetchEmployees();
        }
    }, [show, fetchEmployees]);

    const employeeOptions = employees.map((emp) => ({
        value: emp.Employee,
        label: emp.Employee,
    }));

    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Modal.Header closeButton className="border-bottom-0">
                <Modal.Title className="fw-bold text-primary">Filter Advances</Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-0">
                <Form>
                    <Row className="mb-4">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-muted">Select Employee</Form.Label>
                                <Select
                                    options={employeeOptions}
                                    placeholder="All Employees"
                                    isClearable
                                    value={employeeOptions.find(opt => opt.value === formData.Employee) || null}
                                    onChange={(selected) =>
                                        setFormData({
                                            ...formData,
                                            Employee: selected ? selected.value : "",
                                        })
                                    }
                                    className="rounded-3"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-muted">Date Range</Form.Label>
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

            <Modal.Footer className="border-top-0 d-flex justify-content-end gap-2">
                <Button variant="light" className="px-4 rounded-pill" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" className="px-4 rounded-pill shadow-sm" onClick={() => {
                    const payload = { ...formData };
                    if (!payload.FromDate || !payload.ToDate) {
                        payload.FromDate = moment().subtract(6, "days").format("YYYY-MM-DD");
                        payload.ToDate = moment().format("YYYY-MM-DD");
                    }
                    handleSubmit(payload);
                }}>
                    Apply Filters
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AdvanceSearch;
