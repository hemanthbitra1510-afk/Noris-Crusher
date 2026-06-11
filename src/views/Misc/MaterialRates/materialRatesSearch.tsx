import { Modal, Button, Form } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

interface MaterialRatesSearchProps {
    show: boolean;
    handleClose: () => void;
    handleSubmit: (filters: any) => void;
}

const MaterialRatesSearch = ({ show, handleClose, handleSubmit }: MaterialRatesSearchProps) => {
    const [partyList, setPartyList] = useState([]);
    const [materialList, setMaterialList] = useState([]);
    const [formData, setFormData] = useState({
        Party: "",
        Material: "",
    });

    useEffect(() => {
        if (show) {
            fetchParties();
            fetchMaterials();
        }
    }, [show]);

    const fetchParties = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post(`https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`, { Type: "Party" });
            const options = (res.data || []).map((item: any) => ({
                value: item.LedgerName,
                label: item.LedgerName,
            }));
            setPartyList(options);
        } catch (err) {
            console.error("Fetch parties error", err);
        }
    };

    const fetchMaterials = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get(`https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`);
            const options = (res.data || []).map((item: any) => ({
                value: item.MaterialName,
                label: item.MaterialName,
            }));
            setMaterialList(options);
        } catch (err) {
            console.error("Fetch materials error", err);
        }
    };

    const handleFormSubmit = () => {
        handleSubmit(formData);
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>Filter Material Rates</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form>
                    <div className="row g-3">
                        <div className="col-md-6 text-start">
                            <Form.Label className="fw-bold">Party</Form.Label>
                            <Select
                                options={partyList}
                                isClearable
                                placeholder="Select Party"
                                onChange={(opt: any) => setFormData({ ...formData, Party: opt ? opt.value : "" })}
                                styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>
                        <div className="col-md-6 text-start">
                            <Form.Label className="fw-bold">Material</Form.Label>
                            <Select
                                options={materialList}
                                isClearable
                                placeholder="Select Material"
                                onChange={(opt: any) => setFormData({ ...formData, Material: opt ? opt.value : "" })}
                                styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleFormSubmit}>
                    Search
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MaterialRatesSearch;
