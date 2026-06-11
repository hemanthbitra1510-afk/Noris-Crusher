
import React, { useEffect, useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Form } from "react-bootstrap";

interface LedgerTypeFormProps {
    show: boolean;
    onClose: () => void;
    handleSubmit1: (formData: any) => void;
    initialData: any | null;
}

const LedgerTypeForm: React.FC<LedgerTypeFormProps> = ({
    show,
    onClose,
    handleSubmit1,
    initialData,
}) => {
    const [formData, setFormData] = useState({
        LedgerType: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                LedgerType: initialData.LedgerType || "",
            });
        } else {
            setFormData({
                LedgerType: "",
            });
        }
    }, [initialData, show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit1(formData);
    };

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" backdrop={false} scroll={true}>
            <OffcanvasHeader closeButton>
                <h5 className="mb-0">{initialData ? "Edit Ledger Type" : "Add Ledger Type"}</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Ledger Type</Form.Label>
                        <Form.Control
                            type="text"
                            name="LedgerType"
                            placeholder="Enter Ledger Type"
                            value={formData.LedgerType}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <button type="button" className="btn btn-light me-2" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {initialData ? "Update" : "Save"} Changes
                        </button>
                    </div>
                </Form>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default LedgerTypeForm;
