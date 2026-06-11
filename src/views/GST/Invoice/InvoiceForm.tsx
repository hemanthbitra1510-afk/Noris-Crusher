import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState, useEffect } from "react";
import {
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    Form,
    Row,
    Col,
    Button,
    Table,
    Card,
} from "react-bootstrap";
import { XCircle, PencilSquare, Save, X } from "react-bootstrap-icons";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import dayjs from "dayjs";
import axios from "axios";
import Select from "react-select";
interface Item {
    ID?: any;
    Material: string;
    Tonnes: number;
    Rate: number;
    Amount: number;
    IDS: any;
    Tax: number;
    TaxAmount: number;
    GrandTotal: number
}

interface PurchaseFormProps {
    show: boolean;
    onClose: () => void;
    savePurchase: () => void;
    removeItem: () => void;
    initialData?: {
        Party: string;
        InvDate: string;
        Invoice: string;
        Destination?: string;
        ItemsData: any[];
    };
}

const InvoiceForm: React.FC<PurchaseFormProps> = ({
    show,
    onClose,
    savePurchase,
    removeItem,
    initialData,
}) => {
    const [formData, setFormData] = useState({
        Party: "",
        InvDate: dayjs().format("DD-MM-YYYY"),
        Invoice: "",
        Destination: "",
        ItemsData: [] as Item[],
    });

    const [newItem, setNewItem] = useState<Item>({
        Material: "",
        Tonnes: 0,
        Rate: 0,
        Amount: 0,
        Tax: 0,
        IDS: null,
        TaxAmount: 0,
        GrandTotal: 0,
    });
    const [ledgerOptions, setLedgerOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const saveInvoice = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const payload = {
                Party: formData.Party,
                InvDate: formData.InvDate,
                Invoice: formData.Invoice,
                Destination: formData.Destination,
                ItemsData: formData.ItemsData.map((i) => ({
                    IDS: i.ID ?? "",
                    Material: i.Material,
                    Tonnes: i.Tonnes,
                    Rate: i.Rate,
                    Amount: i.Amount,
                    Tax: i.Tax,
                    TaxAmount: i.TaxAmount,
                    GrandTotal: i.GrandTotal,
                })),
            };

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyInvoiceSave`,
                payload
            );

            onClose(); // ✅ close after save
        } catch (err) {
            console.error("Invoice save failed", err);
            alert("Failed to save invoice");
        }
    };
    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";

                const res = await axios.get(
                    `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
                );

                const data = Array.isArray(res.data) ? res.data : [];

                const options = data.map((item: any) => ({
                    value: item.LedgerName || item.Party || item.Name,
                    label: item.LedgerName || item.Party || item.Name,
                }));

                setLedgerOptions(options);
            } catch (err) {
                console.error("Ledger fetch failed", err);
                setLedgerOptions([]);
            }
        };

        if (show) {
            fetchLedgers();
        }
    }, [show]);
    const deleteInvoiceItem = async (item: Item, index: number) => {
        // 🟡 If item is NEW (not saved yet)
        if (!item.ID) {
            setFormData((prev) => ({
                ...prev,
                ItemsData: prev.ItemsData.filter((_, i) => i !== index),
            }));
            return;
        }

        // 🔴 If item EXISTS in DB
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=DeleteInvoiceData`,
                {
                    IDS: item.ID,   // ⭐ USING InvoiceDetails.ID
                }
            );

            // ✅ Remove from UI after success
            setFormData((prev) => ({
                ...prev,
                ItemsData: prev.ItemsData.filter((_, i) => i !== index),
            }));
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete invoice item");
        }
    };

    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    /** ---------------- LOAD & CONVERT BACKEND DATA ---------------- */
    useEffect(() => {
        if (initialData && Array.isArray(initialData)) {
            const convertedItems: Item[] = initialData.map((item: any) => ({
                Material: item.Material || "",
                ID: item.ID || "",
                Tonnes: parseFloat(item.Tonnes) || 0,
                Rate: parseFloat(item.Rate) || 0,
                Amount: parseFloat(item.Amount) || 0,
                Tax: parseFloat(item.Tax) || 0,
                TaxAmount: parseFloat(item.TaxAmount) || 0,
                GrandTotal: parseFloat(item.GrandTotal) || 0,
            }));
            setFormData({
                Party: initialData[0]?.Party || "",
                InvDate: initialData[0]?.InvDate || "",
                Invoice: initialData[0]?.Invoice || "",
                Destination: initialData[0]?.Destination || "",
                ItemsData: convertedItems,
            });
        } else {
            setFormData({
                Party: "",
                InvDate: dayjs().format("DD-MM-YYYY"),
                Invoice: "",
                Destination: "",
                ItemsData: [],
            });
            setNewItem({
                Material: "",
                Tonnes: 0,
                Rate: 0,
                Amount: 0,
                Tax: 0,
                IDS: null,
                TaxAmount: 0,
                GrandTotal: 0,
            });
        }
    }, [initialData, show]); console.log(formData)
    /** ---------------- ITEM HANDLERS ---------------- */
    const handleNewItemChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        field: keyof Item
    ) => {
        const accessDenied = checkPageAccess("GST", "Invoice");
        if (accessDenied) return accessDenied;

        let value: string | number = e.target.value;

        if (["Tonnes", "Rate", "Tax"].includes(field)) {
            value = parseFloat(value) || 0;
        }

        const updated = { ...newItem, [field]: value };

        const tonnes = updated.Tonnes || 0;
        const rate = updated.Rate || 0;
        const tax = updated.Tax || 0;
        updated.Amount = tonnes * rate;
        updated.TaxAmount = (tonnes * rate * tax) / 100;
        updated.GrandTotal = updated.Amount + updated.TaxAmount
        setNewItem(updated);
    };

    const addItem = () => {
        if (!newItem.Material) return;
        setFormData((prev) => ({
            ...prev,
            ItemsData: [...prev.ItemsData, newItem],
        }));
        setNewItem({
            Material: "",
            Tonnes: 0,
            Rate: 0,
            Amount: 0,
            Tax: 0,
            TaxAmount: 0,
            GrandTotal: 0,
        });
    };


    const handleEditChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        field: keyof Item
    ) => {
        if (editingIndex === null) return;
        const updatedItems = [...formData.ItemsData];

        let value: string | number = e.target.value;
        if (["Tonnes", "Rate", "Tax"].includes(field)) {
            value = parseFloat(value) || 0;
        }

        updatedItems[editingIndex] = {
            ...updatedItems[editingIndex],
            [field]: value,
        };

        const tonnes = updatedItems[editingIndex].Tonnes || 0;
        const rate = updatedItems[editingIndex].Rate || 0;
        const tax = updatedItems[editingIndex].Tax || 0;

        updatedItems[editingIndex].Amount = tonnes * rate;
        updatedItems[editingIndex].TaxAmount = (tonnes * rate * tax) / 100;
        updatedItems[editingIndex].GrandTotal = (tonnes * rate) + ((tonnes * rate * tax) / 100);

        setFormData((prev) => ({ ...prev, ItemsData: updatedItems }));
    };

    const saveEdit = () => setEditingIndex(null);
    const cancelEdit = () => setEditingIndex(null);

    /** ---------------- TOTAL CALCULATION ---------------- */
    const totalAmount = formData.ItemsData.reduce((sum, item) => sum + item.Amount, 0);
    const totalGST = formData.ItemsData.reduce((sum, item) => sum + item.TaxAmount, 0);
    const grandTotal = totalAmount + totalGST;

    /** ---------------- FORM HANDLERS ---------------- */
    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string
    ) => {
        setFormData({ ...formData, [field]: e.target.value });
    };


    return (
        <Offcanvas show={show} onHide={onClose} placement="end" backdrop="static" >
            <OffcanvasHeader closeButton>
                <h5 className="mb-0">GST Invoice</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                {/* Header Fields */}
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>Party</Form.Label>
                            <Select
                                options={ledgerOptions}
                                value={
                                    formData.Party
                                        ? { value: formData.Party, label: formData.Party }
                                        : null
                                }
                                onChange={(selected: any) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        Party: selected ? selected.value : "",
                                    }))
                                }
                                placeholder="Select Party..."
                                isSearchable
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Date</Form.Label>
                            <CommonDatePicker
                                value={formData.InvDate ? dayjs(formData.InvDate, "DD-MM-YYYY") : null} // ✅ autopopulate correctly
                                format="DD-MM-YYYY"
                                onChange={(date) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        InvDate: date ? dayjs(date).format("DD-MM-YYYY") : "",
                                    }))
                                }
                                placeholder="dd-mm-yyyy"
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Invoice No</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.Invoice}
                                placeholder="Invoice No"
                                onChange={(e) => handleFormChange(e, "Invoice")}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Destination</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.Destination}
                                placeholder="Destination"
                                onChange={(e) => handleFormChange(e, "Destination")}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* New Item Form */}
                <Card className="mb-3">
                    <Card.Body>
                        <Row className="g-2">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Material</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Material"
                                        value={newItem.Material}
                                        onChange={(e) => handleNewItemChange(e, "Material")}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Tonnes</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Tonnes"
                                        value={newItem.Tonnes}
                                        onChange={(e) => handleNewItemChange(e, "Tonnes")}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>Rate</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Rate"
                                        value={newItem.Rate}
                                        onChange={(e) => handleNewItemChange(e, "Rate")}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>tax %</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="tax %"
                                        value={newItem.Tax}
                                        onChange={(e) => handleNewItemChange(e, "Tax")}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md="auto" className="d-flex align-items-end">
                                <Button onClick={addItem}>Add</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Items Table */}
                <Table bordered hover size="sm" responsive style={{ minWidth: "730px" }}>
                    <thead className="bg-dark text-white">
                        <tr>
                            <th>#</th>
                            <th>Material</th>
                            <th>Tonnes </th>
                            <th>Rate / Amount</th>
                            <th>Tax% / Amount</th>
                            <th>Grand Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.ItemsData.map((item, index) => (
                            <tr key={index} className="align-middle text-center">
                                <td>{index + 1}</td>
                                <td>
                                    {editingIndex === index ? (
                                        <Form.Control
                                            value={item.Material}
                                            onChange={(e) => handleEditChange(e, "Material")}
                                        />
                                    ) : (
                                        item.Material
                                    )}
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                        <Form.Control
                                            type="number"
                                            style={{ minWidth: "80px" }}   // 
                                            value={item.Tonnes}
                                            onChange={(e) => handleEditChange(e, "Tonnes")}
                                        />
                                    ) : (
                                        item.Tonnes
                                    )}
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                        <Form.Control
                                            type="number"
                                            value={item.Rate}
                                            onChange={(e) => handleEditChange(e, "Rate")}
                                        />
                                    ) : (
                                        <>
                                            {item.Rate} <br />
                                            <span className="text-success">
                                                {item.Amount.toFixed(2)}
                                            </span>
                                        </>
                                    )}
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                        <Form.Control
                                            type="number"
                                            value={item.Tax}
                                            onChange={(e) => handleEditChange(e, "Tax")}
                                        />
                                    ) : (
                                        <>
                                            {item.Tax}% <br />
                                            <span className="text-danger">
                                                ({item.TaxAmount.toFixed(2)})
                                            </span>
                                        </>
                                    )}
                                </td>
                                <td>
                                    <span className="text-dark">
                                        {item.GrandTotal.toFixed(2)}
                                    </span>
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                        <>
                                            <Button
                                                variant="outline p-0 me-2"
                                                size="lg"
                                                onClick={saveEdit}
                                            >
                                                <Save className="text-success" />
                                            </Button>
                                            <Button
                                                variant="outline p-0 me-2"
                                                size="lg"
                                                onClick={cancelEdit}
                                            >
                                                <X className="text-danger" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline p-0 me-2"
                                            size="lg"
                                            onClick={() => setEditingIndex(index)}
                                        >
                                            <PencilSquare className="text-primary" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline p-0"
                                        size="lg"
                                        onClick={() => deleteInvoiceItem(item, index)}
                                    >
                                        <XCircle className="text-danger" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="text-center bg-light">
                            <td colSpan={3} className="text-end text-dark">
                                Totals:
                            </td>
                            <td>
                                <small>total Amount:</small>
                                <br />
                                <div className="text-success">{totalAmount.toFixed(2)}</div>
                            </td>
                            <td>
                                <small>total tax</small>
                                <div className="text-danger"> +{totalGST.toFixed(2)}</div>
                            </td>
                            <td colSpan={2} style={{ color: "blue" }}>
                                = {grandTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </Table>

                {/* Save / Cancel */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={saveInvoice}
                    >
                        Save
                    </Button>

                </div>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default InvoiceForm;