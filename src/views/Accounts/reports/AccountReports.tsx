import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import Select from "react-select";
import { Modal, Row, Col, Button } from "react-bootstrap";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface ReportRow {
  sno: number;
  Date: string;
  Desciption: string;
  Payable: number;
  Paid: number;
  Balance: number;
}

interface Ledger {
  ID: string;
  Party: string;
  Type: string;
}

const AccountReports = () => {
  const accessDenied = checkPageAccess("Accounts", "Reports");
  if (accessDenied) return accessDenied;

  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showFilterModal, setShowFilterModal] = useState(false);

  const [filters, setFilters] = useState({
    LedgerName: "",
    LedgerType: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  const headers = [
    { label: "S.No", key: "sno", dataType: "string" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Description", key: "Desciption", dataType: "string" },
    { label: "Payable", key: "Payable", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  /* ================= ADD SPINNER KEYFRAME ================= */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    fetchLedgers();

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  /* ========================================================= */

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      setLedgers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Ledger fetch error:", err);
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerReport = async (activeFilters: any) => {
    try {
      setLoading(true);

      if (!activeFilters.LedgerName || !activeFilters.LedgerType) {
        alert("Please select Ledger");
        setLoading(false);
        return;
      }

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        Ledger: activeFilters.LedgerName,
        FromDate: activeFilters.FromDate,
        ToDate: activeFilters.ToDate,
      };

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/LedgerReports.php?ID=${id}&Table=${activeFilters.LedgerType}`,
        payload
      );

      const rawData = Array.isArray(res.data) ? res.data : [];

      const formatted: ReportRow[] = rawData.map((row, index) => ({
        sno: index + 1,
        Date: row.Date || "",
        Desciption: row.Desciption || "",
        Payable: Number(row.Payable || 0),
        Paid: Number(row.Paid || 0),
        Balance: Number(row.Balance || 0),
      }));

      setReportData(formatted);
    } catch (err) {
      console.error("Ledger report error:", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = ["All"];

  return (
    <div className="page-wrapper">
      <div className="content p-2">

        {/* ================= LOADING SECTION ================= */}
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
          <>
            {/* Applied Filters */}

            <ProductionList
              title="Ledger Report"
              periodOptions={periodOptions}
              tableHeaders={headers}
              dealsData={reportData}
              onAddLedgerClick={hasPermission("Accounts", "Reports", "Added") ? () => setShowLedgerForm(true) : undefined}
              handleShow={() => setShowFilterModal(true)}
              appliedFilters={appliedFilters}
            />
          </>
        )}
        {/* ================================================= */}

        {/* FILTER MODAL */}
        <Modal
          show={showFilterModal}
          onHide={() => setShowFilterModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Filter Ledger Report</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <label className="form-label">Ledger</label>
                <Select
                  options={ledgers.map((l) => ({
                    value: l.Party,
                    label: l.Party,
                  }))}
                  isSearchable
                  isClearable
                  onChange={(selected) => {
                    const selectedLedger = ledgers.find(
                      (l) => l.Party === selected?.value
                    );

                    setFilters({
                      ...filters,
                      LedgerName: selected?.value || "",
                      LedgerType: selectedLedger?.Type || "",
                    });
                  }}
                />
              </Col>

              <Col md={3}>
                <label className="form-label">From</label>
                <input
                  type="date"
                  className="form-control"
                  onChange={(e) =>
                    setFilters({ ...filters, FromDate: e.target.value })
                  }
                />
              </Col>

              <Col md={3}>
                <label className="form-label">To</label>
                <input
                  type="date"
                  className="form-control"
                  onChange={(e) =>
                    setFilters({ ...filters, ToDate: e.target.value })
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                setAppliedFilters({
                  Ledger: filters.LedgerName,
                  Type: filters.LedgerType,
                  From: filters.FromDate,
                  To: filters.ToDate,
                });

                fetchLedgerReport(filters);
                setShowFilterModal(false);
              }}
            >
              Search
            </Button>
          </Modal.Footer>
        </Modal>

        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={() => { }}
        />
      </div>
    </div>
  );
};

export default AccountReports;

