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
import CommonSelect from "../../../components/common-select/commonSelect";
interface Ledger {
  Party: string;
  Type: string;
}


interface Item {
  Spares: string;
  Particular: string;
  Stock: string;
  Qty: number;
  Rate: number;
  Amount: number;
  ID1: any;
  GST: number;
  GSTAmount: number;
}

interface PurchaseFormProps {
  show: boolean;
  onClose: () => void;
  handleSubmit1: (data: any) => void;
  initialData?: any[]; // backend returns ARRAY
}


const AccountPurchaseForm: React.FC<PurchaseFormProps> = ({
  show,
  onClose,
  handleSubmit1,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    Names: "",
    Date1: dayjs().format("DD-MM-YYYY"),
    BillNo: "",
    Items: [] as Item[],
  });

  const [newItem, setNewItem] = useState<Item>({
    Spares: "",
    Particular: "",
    Stock: "",
    Qty: 0,
    Rate: 0,
    Amount: 0,
    GST: 0,
    ID1: null,
    GSTAmount: 0,
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get<Ledger[]>(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        const partyLedgers = Array.isArray(res.data)
          ? res.data
          : [];



        setLedgers(partyLedgers);
      } catch (err) {
        console.error("Failed to fetch party ledgers", err);
      }
    };

    fetchLedgers();
  }, []);
  const ledgerOptions = [
    ...ledgers.map((l) => ({
      value: l.Party,
      label: `${l.Party} (${l.Type})`,
    })),
    { value: "__other__", label: "Other" },   // ✅ Add Other option
  ];


  /** ---------------- LOAD & CONVERT BACKEND DATA ---------------- */
  useEffect(() => {
    if (Array.isArray(initialData) && initialData.length > 0) {
      const convertedItems: Item[] = initialData.map((item: any) => ({
        Spares: item.Spares || "",
        Particular: item.Particular || "",
        Stock: item.Stock || "",
        ID1: item.ID1 || "", // ✅ FIXED
        Qty: Number(item.Qty) || 0,
        Rate: Number(item.Rate) || 0,
        Amount: Number(item.Amount) || 0,
        GST: Number(item.GST) || 0,
        GSTAmount: Number(item.GSTAmount) || 0,
      }));

      setFormData({
        Names: initialData[0]?.Names || "",
        Date1: initialData[0]?.Date1 || "",
        BillNo: initialData[0]?.BillNo || "",
        Items: convertedItems,
      });
    }
  }, [initialData]);

  console.log(formData)
  /** ---------------- ITEM HANDLERS ---------------- */
  const handleNewItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Item
  ) => {
    const accessDenied = checkPageAccess("Accounts", "Daybook");
    if (accessDenied) return accessDenied;

    let value: string | number = e.target.value;

    if (["Qty", "Rate", "GST"].includes(field)) {
      value = parseFloat(value) || 0;
    }

    const updated = { ...newItem, [field]: value };

    const qty = updated.Qty || 0;
    const rate = updated.Rate || 0;
    const gst = updated.GST || 0;

    updated.Amount = qty * rate;
    updated.GSTAmount = (qty * rate * gst) / 100;

    setNewItem(updated);
  };
  const fetchSpares = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MySpares`
      );

      setSpares(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load spares", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSpares();
  }, []);


  const addItem = () => {
    if (!newItem.Spares) return;
    setFormData((prev) => ({
      ...prev,
      Items: [...prev.Items, newItem],
    }));
    setNewItem({
      Spares: "",
      Particular: "",
      Stock: "",
      Qty: 0,
      Rate: 0,
      Amount: 0,
      GST: 0,
      GSTAmount: 0,
    });
  };
  const [spares, setSpares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  const removeItem = async (index: number) => {
    const itemToDelete = formData.Items[index];

    try {
      // ✅ If item already exists in DB
      if (itemToDelete.ID1) {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        await axios.post(
          `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=DeletePurchaseData`,
          {
            IDS: itemToDelete.ID1   // ✅ SEND ID1
          }
        );
      }

      // ✅ Remove from UI
      const updated = [...formData.Items];
      updated.splice(index, 1);
      setFormData({ ...formData, Items: updated });

    } catch (err) {
      console.error("Failed to delete purchase item", err);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Item
  ) => {
    if (editingIndex === null) return;
    const updatedItems = [...formData.Items];

    let value: string | number = e.target.value;
    if (["Qty", "Rate", "GST"].includes(field)) {
      value = parseFloat(value) || 0;
    }

    updatedItems[editingIndex] = {
      ...updatedItems[editingIndex],
      [field]: value,
    };

    const qty = updatedItems[editingIndex].Qty || 0;
    const rate = updatedItems[editingIndex].Rate || 0;
    const gst = updatedItems[editingIndex].GST || 0;

    updatedItems[editingIndex].Amount = qty * rate;
    updatedItems[editingIndex].GSTAmount = (qty * rate * gst) / 100;

    setFormData((prev) => ({ ...prev, Items: updatedItems }));
  };

  const saveEdit = () => setEditingIndex(null);
  const cancelEdit = () => setEditingIndex(null);

  /** ---------------- TOTAL CALCULATION ---------------- */
  const totalAmount = formData.Items.reduce((sum, item) => sum + item.Amount, 0);
  const totalGST = formData.Items.reduce((sum, item) => sum + item.GSTAmount, 0);
  const grandTotal = totalAmount + totalGST;

  /** ---------------- FORM HANDLERS ---------------- */
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const savePurchase = () => {
    handleSubmit1({
      BillNo: formData.BillNo,
      Names: formData.Names,
      Date1: formData.Date1,
      Items: formData.Items.map((item) => ({
        Spares: item.Spares,
        Stock: item.Stock,
        Qty: item.Qty,
        Rate: item.Rate,
        Amount: item.Amount,
        Particular: item.Particular,
        GST: item.GST,
        GSTAmount: item.GSTAmount,
        Total: item.Amount + item.GSTAmount, // ✅ REQUIRED FOR PHP
        ID1: item.ID1 ?? "",                 // ✅ REQUIRED FOR PHP
      })),
    });
  };



  return (
    <Offcanvas show={show} onHide={onClose} placement="end" backdrop="static" style={{ width: "80%" }}>
      <OffcanvasHeader closeButton>
        <h5 className="mb-0">Purchase Entry</h5>
      </OffcanvasHeader>
      <OffcanvasBody>
        {/* Header Fields */}
        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Party</Form.Label>
              <CommonSelect
                options={ledgerOptions}
                placeholder="Select Party"
                value={ledgerOptions.find(
                  (opt) => opt.value === formData.Names
                )}
                onChange={(selected) =>
                  setFormData((prev) => ({
                    ...prev,
                    Names: selected?.value || "",
                  }))
                }
              />

            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Date</Form.Label>
              <CommonDatePicker
                value={formData.Date1 ? dayjs(formData.Date1, "DD-MM-YYYY") : null} // ✅ autopopulate correctly
                format="DD-MM-YYYY"
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    Date1: date ? dayjs(date).format("DD-MM-YYYY") : "",
                  }))
                }
                placeholder="dd-mm-yyyy"
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Bill No</Form.Label>
              <Form.Control
                type="text"
                value={formData.BillNo}
                placeholder="Bill No"
                onChange={(e) => handleFormChange(e, "BillNo")}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* New Item Form */}
        <Card className="mb-3">
          <Card.Body>
            <Row className="g-2">
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Spares</Form.Label>
                  <CommonSelect
                    options={spares.map((item: any) => ({
                      label: item.Spares,
                      value: item.Spares,
                    }))}
                    placeholder="Search Spares..."
                    isSearchable
                    isLoading={loading}
                    value={
                      spares
                        .map((item: any) => ({
                          label: item.Spares,
                          value: item.Spares,
                        }))
                        .find((opt) => opt.value === newItem.Spares) || null
                    }
                    onChange={(selected) =>
                      setNewItem((prev) => ({
                        ...prev,
                        Spares: selected?.value || "",
                      }))
                    }
                  />


                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Particular</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Particular"
                    value={newItem.Particular}
                    onChange={(e) => handleNewItemChange(e, "Particular")}
                  />
                </Form.Group>
              </Col>

              <Col md={1}>
                <Form.Group>
                  <Form.Label>Qty</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Qty"
                    value={newItem.Qty}
                    onChange={(e) => handleNewItemChange(e, "Qty")}
                  />
                </Form.Group>
              </Col>

              <Col md={1}>
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

              <Col md={1}>
                <Form.Group>
                  <Form.Label>GST %</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="GST %"
                    value={newItem.GST}
                    onChange={(e) => handleNewItemChange(e, "GST")}
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label>Stock</Form.Label>
                  <Form.Select
                    value={newItem.Stock}
                    onChange={(e) => handleNewItemChange(e, "Stock")}
                  >
                    <option value="">Select Stock</option>
                    <option value="Stock">Stock</option>
                    <option value="_">_</option>
                  </Form.Select>
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
              <th>Spares</th>
              <th>Particular</th>
              <th>Qty </th>
              <th>Rate / Amount</th>
              <th>Gst% / Amount</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.Items.map((item, index) => (
              <tr key={index} className="align-middle text-center">
                <td>{index + 1}</td>
                <td>
                  {editingIndex === index ? (
                    <Form.Control
                      value={item.Spares}
                      onChange={(e) => handleEditChange(e, "Spares")}
                    />
                  ) : (
                    item.Spares
                  )}
                </td>
                <td>
                  {editingIndex === index ? (
                    <Form.Control
                      value={item.Particular}
                      style={{ minWidth: "120px" }}
                      onChange={(e) => handleEditChange(e, "Particular")}
                    />
                  ) : (
                    item.Particular
                  )}
                </td>
                <td>
                  {editingIndex === index ? (
                    <Form.Control
                      type="number"
                      style={{ minWidth: "80px" }}   // 
                      value={item.Qty}
                      onChange={(e) => handleEditChange(e, "Qty")}
                    />
                  ) : (
                    item.Qty
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
                      value={item.GST}
                      onChange={(e) => handleEditChange(e, "GST")}
                    />
                  ) : (
                    <>
                      {item.GST}% <br />
                      <span className="text-danger">
                        ({item.GSTAmount.toFixed(2)})
                      </span>
                    </>
                  )}
                </td>
                <td>
                  {editingIndex === index ? (
                    <Form.Select
                      value={item.Stock}
                      style={{ minWidth: "80px" }}
                      onChange={(e) => handleEditChange(e, "Stock")}
                    >
                      <option value="Stock">Stock</option>
                      <option value="_">_</option>
                    </Form.Select>
                  ) : (
                    item.Stock
                  )}
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
                    onClick={() => removeItem(index)}
                  >
                    <XCircle className="text-danger" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-center bg-light">
              <td colSpan={4} className="text-end text-dark">
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
          <Button variant="primary" onClick={savePurchase}>
            Save Purchase
          </Button>
        </div>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default AccountPurchaseForm;

