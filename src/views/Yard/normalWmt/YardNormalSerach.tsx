import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import moment from "moment";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import axios from "axios";
import Select from "react-select";
interface SearchModalProps {
    show: boolean;
    handleClose: () => void;
    handleSubmit: (formData: SearchFormData) => void;
}

interface SearchFormData {
    Party: string;
    Material: string;
    Vehicle: string;
    FromDate: string;
    ToDate: string;
}

interface Ledger {
    Party: string;
    Type: string;
}

interface MaterialItem {
    Material: string;
}

const YardNormalSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
    const accessDenied = checkPageAccess("Yard", "Normal Wmt");
    if (accessDenied) return accessDenied;

    const [formData, setFormData] = useState<SearchFormData>({
        Party: "",
        Material: "",
        Vehicle: "",
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });

    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [materials, setMaterials] = useState<MaterialItem[]>([]);

    useEffect(() => {
        if (show) {
            fetchLedgers();
            fetchMaterials();
        }
    }, [show]);

    const fetchLedgers = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
            );
            const data = Array.isArray(res.data) ? res.data : [];
            setLedgers(data);
        } catch (err) {
            console.error("Failed to load ledgers", err);
        }
    };

    const fetchMaterials = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
            );
            const data = Array.isArray(res.data) ? res.data : [];
            setMaterials(data);
        } catch (err) {
            console.error("Failed to load materials", err);
        }
    };

    const toOptions = () =>
        ledgers
            .map((l) => ({ value: l.Party, label: l.Party }));

    const materialOptions = materials.map((m) => ({
        value: m.Material,
        label: m.Material,
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateRangeChange = (start: string, end: string) => {
        setFormData((prev) => ({
            ...prev,
            FromDate: start,
            ToDate: end,
        }));
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Modal.Header closeButton>
                <Modal.Title>Search Filters</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Row className="gy-3">
                        {/* Party */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Party</Form.Label>
                                <Select
                                    options={toOptions()}
                                    placeholder="Search & Select Party..."
                                    isClearable
                                    value={
                                        toOptions().find(
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

                        {/* Material */}
                        <Col md={12}>
                            <Form.Floating>
                                <Form.Control
                                    type="text"
                                    name="Material"
                                    id="floatingMaterial"
                                    value={formData.Material}
                                    onChange={handleChange}
                                    placeholder="Material"
                                />
                                <label htmlFor="floatingMaterial">Material</label>
                            </Form.Floating>
                        </Col>

                        {/* Vehicle */}
                        <Col md={12}>
                            <Form.Floating>
                                <Form.Control
                                    type="text"
                                    name="Vehicle"
                                    id="floatingVehicle"
                                    value={formData.Vehicle}
                                    onChange={handleChange}
                                    placeholder="Vehicle"
                                />
                                <label htmlFor="floatingVehicle">Vehicle</label>
                            </Form.Floating>
                        </Col>
                        {/* Date Range */}
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Select Date Range</Form.Label>
                                <PredefinedDatePicker onChange={handleDateRangeChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between">
                <Button variant="secondary" onClick={handleClose}>
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
                    Apply Filters
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default YardNormalSearch;

