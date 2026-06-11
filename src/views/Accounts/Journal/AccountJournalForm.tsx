import { checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import {
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Form,
  Row,
  Col,
  Button,
  Table,
  Alert,
} from "react-bootstrap";
import { XCircle, PencilSquare, CheckLg } from "react-bootstrap-icons";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import dayjs from "dayjs";
import axios from "axios";
/* ================= TYPES ================= */

interface ApiJVRow {
  IDS: string;
  Description: string;
  Date1: string;
  JVNumber: string;
  Ledger: string;
  Debited: string;
  Credited: string;
  Particular: string;
}

interface JournalItem {
  ID: string | null;
  Ledger: string;
  Description: string;
  Debited: number;
  Credited: number;
  ByTo: "By" | "To";
  isEditing?: boolean;
}

interface FormDataType {
  JVNumber: string;
  Date1: string;
  Particular: string;
  ItemsData: JournalItem[];
}

interface SavePayload {
  JVNumber: string;
  Date1: string;
  Particular: string;
  ItemsData: {
    IDS: string | null;
    Ledger: string;
    Description: string;
    Debited: number;
    Credited: number;
    ByTo: "By" | "To";
  }[];
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (payload: SavePayload) => void;
  initialData?: ApiJVRow[];
}
const AccountJournalForm: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  initialData,
}) => {
  const accessDenied = checkPageAccess("Accounts", "Journals");
  if (accessDenied) return accessDenied;

  const isEditMode = Boolean(initialData?.length);

  const [formData, setFormData] = useState<FormDataType>({
    JVNumber: "",
    Date1: dayjs().format("DD-MM-YYYY"),
    Particular: "",
    ItemsData: [],
  });

  const [newItem, setNewItem] = useState<JournalItem>({
    Ledger: "",
    Description: "",
    Debited: 0,
    Credited: 0,
    ByTo: "To",
    ID: null,
  });

  /* ================= AUTO JV NUMBER ================= */

  useEffect(() => {
    if (!isEditMode) {
      setFormData((p) => ({
        ...p,
      }));
    }
  }, [isEditMode]);
  const [ledgers, setLedgers] = useState<{ Party: string; Type: string }[]>([]);
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );

        setLedgers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch ledgers", err);
      }
    };

    fetchLedgers();
  }, []);

  /* ================= LOAD EDIT DATA ================= */

  useEffect(() => {
    if (!initialData || initialData.length === 0) return;

    const header = initialData[0];

    const items: JournalItem[] = initialData.map((r) => ({
      ID: r.IDS,
      Ledger: r.Ledger,
      Description: r.Description || "",
      Debited: Number(r.Debited),
      Credited: Number(r.Credited),
      ByTo: Number(r.Debited) > 0 ? "To" : "By",
      isEditing: false,
    }));
    setFormData({
      JVNumber: header.JVNumber,
      Date1: header.Date1,
      Particular: header.Particular,
      ItemsData: items,
    });
  }, [initialData]);
  const addItem = () => {
    if (!newItem.Ledger) {
      alert("Ledger is required");
      return;
    }

    if (
      (newItem.ByTo === "To" && newItem.Debited <= 0) ||
      (newItem.ByTo === "By" && newItem.Credited <= 0)
    ) {
      alert("Amount is required");
      return;
    }


    setFormData((p) => ({
      ...p,
      ItemsData: [...p.ItemsData, { ...newItem }],
    }));

    setNewItem({
      Ledger: "",
      Description: "",
      Debited: 0,
      Credited: 0,
      ByTo: "To",
      ID: null,
    });
  };

  const removeItem = async (index: number) => {
    const row = formData.ItemsData[index];

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyJournalDelete`,
        {
          IDS: row.ID, // payload
        }
      );

      setFormData((p) => ({
        ...p,
        ItemsData: p.ItemsData.filter((_, i) => i !== index),
      }));

    } catch (err) {
      console.error("Delete API error:", err);
    }
  };

  /* ================= INLINE EDIT ================= */

  const toggleEdit = (index: number) => {
    setFormData((p) => ({
      ...p,
      ItemsData: p.ItemsData.map((r, i) =>
        i === index ? { ...r, isEditing: !r.isEditing } : r
      ),
    }));
  };

  const updateRow = (
    index: number,
    field: keyof JournalItem,
    value: any
  ) => {
    setFormData((p) => ({
      ...p,
      ItemsData: p.ItemsData.map((r, i) => {
        if (i !== index) return r;

        const updated = { ...r, [field]: value };

        if (field === "Debited" && value > 0) {
          updated.Credited = 0;
          updated.ByTo = "To";
        }
        if (field === "Credited" && value > 0) {
          updated.Debited = 0;
          updated.ByTo = "By";
        }

        return updated;
      }),
    }));
  };

  /* ================= TOTALS ================= */

  const totalDebit = formData.ItemsData.reduce((s, i) => s + i.Debited, 0);
  const totalCredit = formData.ItemsData.reduce((s, i) => s + i.Credited, 0);
  const diff = totalDebit - totalCredit;

  const handleSave = () => {
    if (formData.ItemsData.length === 0) {
      alert("At least one journal row required");
      return;
    }

    if (totalDebit !== totalCredit) {
      alert("Debit and Credit must be equal");
      return;
    }

    const payload = {
      JVNumber: formData.JVNumber,
      Date1: formData.Date1,
      Particular: formData.Particular,
      ItemsData: formData.ItemsData.map((i) => ({
        IDS: i.ID ? i.ID : "",   // existing → send ID, new → empty
        Ledger: i.Ledger,
        Description: i.Description,
        Debited: i.Debited,
        Credited: i.Credited,
        ByTo: i.ByTo
      }))
    };

    onSave(payload);   // 🔥 PASS TO PARENT
    onClose();
  };

  /* ================= CTRL + S ================= */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [formData]);

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" backdrop="static" style={{ width: '80%' }}>
      <OffcanvasHeader closeButton>
        <h5>Journal Voucher</h5>
      </OffcanvasHeader>

      <OffcanvasBody>
        <Row className="mb-3">

          <Col md={3}>
            <Form.Label>JV Number</Form.Label>
            <Form.Control
              value={formData.JVNumber}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  JVNumber: e.target.value,
                }))
              }
            />
          </Col>

          <Col md={3}>
            <Form.Label>Date</Form.Label>
            <CommonDatePicker
              value={
                formData.Date1
                  ? dayjs(formData.Date1, "DD-MM-YYYY")
                  : null
              }
              format="DD-MM-YYYY"
              onChange={(d) =>
                setFormData((p) => ({
                  ...p,
                  Date1: d ? dayjs(d).format("DD-MM-YYYY") : "",
                }))
              }
            />
          </Col>

          <Col md={6}>
            <Form.Label>Particular</Form.Label>
            <Form.Control
              value={formData.Particular}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  Particular: e.target.value,
                }))
              }
            />
          </Col>

        </Row>

        {/* ADD ROW */}
        <Row className="g-2 mb-3">
          <Col md={3}>
            <Form.Select
              value={newItem.Ledger}
              onChange={(e) =>
                setNewItem({ ...newItem, Ledger: e.target.value })
              }
            >
              <option value="">Select Ledger</option>
              {ledgers.map((l, index) => (
                <option key={index} value={l.Party}>
                  {l.Party} ({l.Type})
                </option>
              ))}

              <option value="__other__">Other</option>

            </Form.Select>


          </Col>

          <Col md={3}>
            <Form.Control
              placeholder="Narration"
              value={newItem.Description}
              onChange={(e) =>
                setNewItem({ ...newItem, Description: e.target.value })
              }
            />
          </Col>

          <Col md={2}>
            <Form.Select
              value={newItem.ByTo}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  ByTo: e.target.value as "By" | "To",
                  Debited: e.target.value === "To" ? newItem.Debited : 0,
                  Credited: e.target.value === "By" ? newItem.Credited : 0,
                })
              }
            >
              <option value="To">To (Debit)</option>
              <option value="By">By (Credit)</option>
            </Form.Select>
          </Col>

          <Col md={2}>
            <Form.Control
              type="number"
              placeholder="Amount"
              value={
                newItem.ByTo === "To"
                  ? newItem.Debited || ""
                  : newItem.Credited || ""
              }
              onChange={(e) => {
                const amount = Number(e.target.value) || 0;

                setNewItem({
                  ...newItem,
                  Debited: newItem.ByTo === "To" ? amount : 0,
                  Credited: newItem.ByTo === "By" ? amount : 0,
                });
              }}
            />
          </Col>

        </Row>

        <Button size="sm" onClick={addItem}>
          Add Row
        </Button>

        {/* TABLE */}
        <Table bordered size="sm" className="mt-3">
          <thead className="bg-dark text-white">
            <tr>
              <th>#</th>
              <th>Ledger</th>
              <th>Narration</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {formData.ItemsData.map((r, i) => (
              <tr key={i} className={r.isEditing ? "table-warning" : ""}>
                <td>{i + 1}</td>

                <td>
                  {r.isEditing ? (
                    <Form.Select
                      value={r.Ledger}
                      onChange={(e) =>
                        updateRow(i, "Ledger", e.target.value)
                      }
                    >
                      <option value="">Select Ledger</option>
                      {ledgers.map((l, index) => (
                        <option key={index} value={l.Party}>
                          {l.Party} ({l.Type})
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    r.Ledger
                  )}

                </td>

                <td>
                  {r.isEditing ? (
                    <Form.Control
                      value={r.Description}
                      onChange={(e) =>
                        updateRow(i, "Description", e.target.value)
                      }
                    />
                  ) : (
                    r.Description
                  )}
                </td>

                <td>
                  {r.isEditing ? (
                    <Form.Control
                      type="number"
                      value={r.Debited || ""}
                      onChange={(e) =>
                        updateRow(i, "Debited", Number(e.target.value))
                      }
                    />
                  ) : (
                    <span className="text-success">{r.Debited}</span>
                  )}
                </td>

                <td>
                  {r.isEditing ? (
                    <Form.Control
                      type="number"
                      value={r.Credited || ""}
                      onChange={(e) =>
                        updateRow(i, "Credited", Number(e.target.value))
                      }
                    />
                  ) : (
                    <span className="text-danger">{r.Credited}</span>
                  )}
                </td>

                <td className="text-center">
                  {r.isEditing ? (
                    <CheckLg
                      className="text-success me-2"
                      onClick={() => toggleEdit(i)}
                    />
                  ) : (
                    <PencilSquare
                      className="me-2"
                      onClick={() => toggleEdit(i)}
                    />
                  )}
                  <XCircle
                    className="text-danger"
                    onClick={() => removeItem(i)}
                  />
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="fw-bold">
              <td colSpan={3}>Total</td>
              <td>{totalDebit}</td>
              <td>{totalCredit}</td>
              <td />
            </tr>
          </tfoot>
        </Table>

        {diff !== 0 && (
          <Alert variant="warning">
            Difference: <b>{Math.abs(diff)}</b>{" "}
            {diff > 0 ? "Credit Required" : "Debit Required"}
          </Alert>
        )}

        <div className="text-end mt-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </OffcanvasBody>
    </Offcanvas>
  );
};
export default AccountJournalForm;
