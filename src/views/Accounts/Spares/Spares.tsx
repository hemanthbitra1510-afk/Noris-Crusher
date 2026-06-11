import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import { Button, Modal, Form, Row, Col, FormGroup } from "react-bootstrap";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

/* ================= TYPES ================= */

interface DashboardListRow {
  [key: string]: any;
}

interface Spare extends DashboardListRow {
  ID?: string;
  Spares?: string;
  HSN?: string;
  Qty?: number;
  Value?: number;
  Date1?: string;
  Measurement?: string;
}

/* ================= COMPONENT ================= */

const Spares = () => {
  const accessDenied = checkPageAccess("Accounts", "Spares Creation");
  if (accessDenied) return accessDenied;

  const [spares, setSpares] = useState<Spare[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  /* ---------- ADD MODAL ---------- */
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Spare>({
    Spares: "",
    HSN: "",
    Qty: 0,
    Value: 0,
    Date1: new Date().toISOString().split("T")[0],
    Measurement: "",
  });

  const showToast = useToast();

  /* ---------- TABLE HEADERS ---------- */
  const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
    { label: "S.NO", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Spare", key: "Spares", dataType: "string" },
    { label: "Measurement", key: "Measurement", dataType: "string" },
    { label: "HSN", key: "HSN", dataType: "string" },
    { label: "Qty", key: "Qty", dataType: "number" },
    { label: "Opening Value", key: "Value", dataType: "number" },
  ];

  /* ================= API ================= */

  const fetchSpares = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MySpares`
      );

      setSpares(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Failed to load spares", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SAVE SPARE ---------- */
  const saveSpare = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MySparesSave`,
        formData
      );

      showToast("Spare saved successfully", "success");
      setShowAdd(false);
      fetchSpares(); // ✅ auto refresh
    } catch {
      showToast("Failed to save spare", "error");
    }
  };

  /* ---------- DELETE SPARE ---------- */
  const deleteSpare = async (row: Spare) => {
    if (!row.ID) return;

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=DeleteSparesData`,
        { IDS: row.ID }
      );

      showToast("Spare deleted", "success");
      fetchSpares(); // ✅ auto refresh
    } catch {
      showToast("Delete failed", "error");
    }
  };

  // Bulk update removed

  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchSpares();
  }, []);


  /* ================= RENDER ================= */

  return (
    <div className="page-wrapper">
      <div className="content p-2">
        {loading ? (
          <div
            style={{
              height: "350px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                position: "relative",
                width: 150,
                height: 150,
              }}
            >
              {/* Rotating Circle */}
              <div
                style={{
                  position: "absolute",
                  width: 150,
                  height: 150,
                  border: "6px solid #e9ecef",
                  borderTop: "6px solid #0d6efd",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />

              {/* Static Logo */}
              <img
                src={logo}
                alt="Loading"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 50,
                  height: 50,
                }}
              />
            </div>
          </div>
        ) : (
          <ListComponent
            title="Spares Master"
            periodOptions={["All"]}
            tableHeaders={headers}
            dealsData={spares}
            loading={loading}

            /* ✅ EXACT PLACE FOR onAddClick */
            onAddClick={hasPermission("Accounts", "Spares Creation", "Added") ? () => {
              setIsEdit(false);                 // 👈 ADD MODE
              setFormData({
                Spares: "",
                HSN: "",
                Qty: 0,
                Value: 0,
                Date1: new Date().toISOString().split("T")[0],
                Measurement: "",
              });
              setShowAdd(true);                 // 👈 OPEN MODAL
            } : undefined}

            handleEdit={hasPermission("Accounts", "Spares Creation", "Updated") ? (row: any) => {
              setIsEdit(true);                  // 👈 EDIT MODE
              setFormData({
                ID: row.ID as string,
                Spares: (row.Spares ?? "") as string,
                HSN: (row.HSN ?? "") as string,
                Qty: (row.Qty ?? 0) as number,
                Value: (row.Value ?? 0) as number,
                Date1: (row.Date1 ?? "") as string,
                Measurement: (row.Measurement ?? "") as string,
              });
              setShowAdd(true);
            } : undefined}

            handleDelete={hasPermission("Accounts", "Spares Creation", "Deleted") ? (row: any) => deleteSpare(row) : undefined}
          />
        )}
      </div>

      {/* ================= ADD MODAL ================= */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Spare</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-2">
            <Col md={6}>
              <FormGroup>
                <Form.Label>Spare Name</Form.Label>
                <Form.Control
                  placeholder="Spare Name"
                  value={formData.Spares}
                  onChange={(e) =>
                    setFormData({ ...formData, Spares: e.target.value })
                  }
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Form.Label>HSN</Form.Label>
                <Form.Control
                  placeholder="HSN"
                  value={formData.HSN}
                  onChange={(e) =>
                    setFormData({ ...formData, HSN: e.target.value })
                  }
                /></FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Form.Label>Quntity</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Qty"
                  value={formData.Qty}
                  onChange={(e) =>
                    setFormData({ ...formData, Qty: Number(e.target.value) })
                  }
                /></FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Form.Label>Value</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Value"
                  value={formData.Value}
                  onChange={(e) =>
                    setFormData({ ...formData, Value: Number(e.target.value) })
                  }
                /></FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Form.Label>Measurement</Form.Label>
                <Form.Control
                  placeholder="Measurement"
                  value={formData.Measurement}
                  onChange={(e) =>
                    setFormData({ ...formData, Measurement: e.target.value })
                  }
                /></FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.Date1}
                  onChange={(e) =>
                    setFormData({ ...formData, Date1: e.target.value })
                  }
                /></FormGroup>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveSpare}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Spares;

