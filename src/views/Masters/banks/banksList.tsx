import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import BankForm from "./bankForm";
import { useToast } from "../../../components/reuse-components/Toast";
import { Offcanvas, Button, Table, Form, Row, Col, Spinner } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DashboardListRow {
  [key: string]: string | number;
}

interface DebitorDeal extends DashboardListRow {
  ID: number;
  Bank: string;
  AccName: string;
  AccBranch: string;
  Date1: string;
  AccType: string;
  AccNo: string;
  OpeningBalance: number;
  PrimaryAccount: string;
}

type SummaryResponse = DebitorDeal[];

const BanksList = () => {
  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<DebitorDeal | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const showToast = useToast();
  const [showStatement, setShowStatement] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<DebitorDeal | null>(null);

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statementData, setStatementData] = useState<any[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const accessDenied = checkPageAccess("Masters", "Banks");
  useEffect(() => {
    const companyData = sessionStorage.getItem("selectedItems1");
    if (companyData) {
      setSelectedCompany(JSON.parse(companyData));
    }
  }, []);


  const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Bank", key: "Bank", dataType: "string" },
    { label: "Account Name", key: "AccName", dataType: "string" },
    { label: "Account Branch", key: "AccBranch", dataType: "string" },
    { label: "Account Type", key: "AccType", dataType: "string" },
    { label: "Account Number", key: "AccNo", dataType: "string" },
    { label: "Balance", key: "Balance", dataType: "number" }, // FIXED// FIXED
  ];

  useEffect(() => {
    if (accessDenied) return;
    apiGet();
  }, [accessDenied]);
  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
  `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetBankDetails`
      );

      setMaterialTop(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      setMaterialTop([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP (smooth transition)
      }, 300);
    }
  };

  const handleAddClick = () => {
    setShowModal(true);
  };
  const handleEditClick = (deal: DebitorDeal) => {
    if (!deal.ID) return; // safety

    setEditData(deal);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleViewClick = (deal: DebitorDeal) => {
    setSelectedAccount(deal);     // ✅ store full account
    setSelectedBank(deal.Bank);   // used for API
    setShowStatement(true);
  };

  useEffect(() => {
    if (accessDenied) return;
    if (showStatement && selectedBank) {
      fetchStatement();
    }
  }, [showStatement, selectedBank, accessDenied]);


  const handleAddBank = async (formData: Partial<DebitorDeal>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=SaveBankDetails`,
        formData
      );

      showToast("Success", "Bank added successfully!", "success");

      apiGet();                 // ✅ refresh list
      setShowModal(false);      // ✅ close modal
      setEditData(null);        // ✅ cleanup
      setIsEdit(false);
    } catch (err) {
      showToast("Error", "Failed to add bank. Please try again.", "danger");
    }
  };

  const fetchStatement = async () => {
    try {
      setStatementLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=BankStatement`,
        {
          Bank: selectedBank,
          FromDate: fromDate,
          ToDate: toDate,
        }
      );

      setStatementData(res.data || []);
    } catch {
      showToast("Error", "Failed to load bank statement", "danger");
    } finally {
      setStatementLoading(false);
    }
  };



  const handleUpdateBank = async (formData: Partial<DebitorDeal>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const recordId = editData?.ID; // ✅ always reliable

      if (!recordId) {
        showToast("Error", "Missing record ID. Update cancelled.", "danger");
        return;
      }

      const { OpeningBalance, ...payload } = formData;

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=SaveBankDetails`,
        {
          ...payload,
          OB: OpeningBalance,        // ✅ OpeningBalance → OB
          IDS: String(recordId),     // ✅ UPDATE identifier
        }
      );

      showToast("Success", "Bank updated successfully!", "success");
      apiGet();
      setShowModal(false);
      setEditData(null);
      setIsEdit(false);
    } catch (err) {
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };


  const handleDelete = async (deal: DebitorDeal) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete bank "${deal.Bank}"?`
    );

    if (!confirmDelete) return;   // ❌ Stop if user cancels

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=DeleteBank`,
        { IDS: String(deal.ID) }
      );

      showToast("Success", "Bank deleted successfully!", "success");
      apiGet();

    } catch (err) {
      console.error("Error deleting bank:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  // Bulk update removed


  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || value === "" || value === 0 || value === "0") return "0.00";
    const cleanValue = String(value).replace(/,/g, "");
    const num = Number(cleanValue);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];
  const exportStatementPdf = () => {
    if (!selectedAccount || !selectedCompany) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - margin * 2;

    // ===== Company Header =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(selectedCompany.Name || "", pageWidth / 2, 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const addressLines = doc.splitTextToSize(
      selectedCompany.State1 || "",
      maxWidth
    );
    doc.text(addressLines, pageWidth / 2, 16, { align: "center" });

    doc.text(
      `Phone: ${selectedCompany.Contact || ""}`,
      pageWidth / 2,
      22,
      { align: "center" }
    );

    doc.text(
      `GSTIN: ${selectedCompany.GST || ""} | IMIE: ${selectedCompany.IMIE || ""}`,
      pageWidth / 2,
      27,
      { align: "center" }
    );

    doc.line(margin, 32, pageWidth - margin, 32);

    // ===== Title =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Bank Statement - ${selectedAccount.Bank}`, pageWidth / 2, 40, {
      align: "center",
    });

    // ===== Account Summary =====
    autoTable(doc, {
      startY: 45,
      head: [["Field", "Value"]],
      body: [
        ["Bank", selectedAccount.Bank],
        ["Account Name", selectedAccount.AccName],
        ["Account Number", selectedAccount.AccNo],
        ["Account Type", selectedAccount.AccType],
        ["Branch", selectedAccount.AccBranch],
        ["Opening Balance", selectedAccount.OpeningBalance],
        ["Date", selectedAccount.Date1],
      ],
    });

    // ===== Statement Table =====
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      head: [["Date", "Particulars", "Debit", "Credit", "Balance"]],
      body: statementData.map((row) => [
        row.Date1,
        row.Particular,
        row.Debit || "-",
        row.Credit || "-",
        row.Balance || row.OpeningBalance || "-",
      ]),
    });

    doc.save(`Bank-Statement-${selectedAccount.Bank}.pdf`);
  };

  const openingBalanceFromDate =
    statementData.find(
      (row) => row.Particular?.toLowerCase() === "opening balance"
    )?.OpeningBalance || 0;


  const exportStatementExcel = () => {
    if (!selectedAccount || !statementData.length) return;

    // 🔹 Account Summary Sheet
    const summary = [
      { Field: "Bank", Value: selectedAccount.Bank },
      { Field: "Account Name", Value: selectedAccount.AccName },
      { Field: "Account Number", Value: selectedAccount.AccNo },
      { Field: "Account Type", Value: selectedAccount.AccType },
      { Field: "Branch", Value: selectedAccount.AccBranch },
      { Field: "Opening Balance", Value: selectedAccount.OpeningBalance },
      { Field: "Date", Value: selectedAccount.Date1 },
    ];

    // 🔹 Statement Sheet (FULL DATA)
    const statement = statementData.map((row) => ({
      Date: row.Date1 ?? "",
      Particulars: row.Particular ?? "",
      Debit: row.Debit ?? "",
      Credit: row.Credit ?? "",
      Balance: row.OpeningBalance ?? "",
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsStatement = XLSX.utils.json_to_sheet(statement);

    // ✅ Auto column width
    wsSummary["!cols"] = [{ wch: 20 }, { wch: 30 }];
    wsStatement["!cols"] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Account Summary");
    XLSX.utils.book_append_sheet(wb, wsStatement, "Statement");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Bank-Statement-${selectedAccount.Bank}.xlsx`
    );
  };




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

              {/* Center Logo */}
              <img
                src={logo}
                alt="Loading"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 55,
                  height: 55,
                }}
              />
            </div>
          </div>
        ) : (
          <ListComponent
            title="Banks"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
            onAddClick={hasPermission("Masters", "Banks", "Added") ? handleAddClick : undefined}
            handleDelete={hasPermission("Masters", "Banks", "Deleted") ? (deal) => handleDelete(deal as any) : undefined}
            handleEdit={hasPermission("Masters", "Banks", "Updated") ? (deal: any) => handleEditClick(deal) : undefined}
            handleView={(deal) => handleViewClick(deal as any)}
            onSuccess={apiGet}
          />
        )}
      </div>
      <BankForm
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditData(null);
          setIsEdit(false);
        }}
        onSubmit={isEdit ? handleUpdateBank : handleAddBank}
        initialData={editData || undefined}
        isEdit={isEdit}




      />
      <Offcanvas
        show={showStatement}
        onHide={() => setShowStatement(false)}
        placement="end"
        style={{ width: "80vw" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Bank Statement – {selectedBank}
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <div className="d-flex justify-content-end mb-3">
            <Button
              variant="outline-success"
              onClick={exportStatementExcel}
              disabled={!statementData.length}
            >
              Export Excel
            </Button>

            <Button variant="outline-danger" onClick={exportStatementPdf}>
              Export PDF
            </Button>
          </div>

          {selectedAccount && (
            <div className="mb-3 p-3 border rounded bg-light">
              <Row className="g-2">
                <Col md={6}><strong>Bank:</strong> {selectedAccount.Bank}</Col>
                <Col md={6}><strong>Account Name:</strong> {selectedAccount.AccName}</Col>

                <Col md={6}><strong>Account Number:</strong> {selectedAccount.AccNo}</Col>
                <Col md={6}><strong>Account Type:</strong> {selectedAccount.AccType}</Col>

                <Col md={6}><strong>Branch:</strong> {selectedAccount.AccBranch}</Col>
                <Col md={6}><strong>Primary Account:</strong> {selectedAccount.PrimaryAcc}</Col>

                <Col md={6}><strong>Opening Balance:</strong> {formatCurrency(openingBalanceFromDate)}</Col>

                {/* <Col md={6}><strong>Date:</strong> {selectedAccount.Date1}</Col> */}
              </Row>
            </div>
          )}

          <Row className="mb-3">
            <Col md={5}>
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Col>

            <Col md={5}>
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Col>

            <Col md={2} className="d-flex align-items-end">
              <Button onClick={fetchStatement}>Go</Button>
            </Col>
          </Row>

          {statementLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table bordered hover size="sm" responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {statementData.length ? (
                  statementData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.Date1}</td>
                      <td>{row.Particular}</td>
                      <td className="text-end">{formatCurrency(row.Debit)}</td>
                      <td className="text-end">{formatCurrency(row.Credit)}</td>
                      <td className="text-end">{formatCurrency(row.OpeningBalance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Offcanvas.Body>
      </Offcanvas>

    </div>
  );
};

export default BanksList;

