import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// Define the shape of each row in the response
interface DebitorEntry {
  Party: string;
  Opening: string;
  BalanceDate: string | null;
  Credit: string;
  Paid: string | null;
  Taxes: string | null;
  Balance: number;
}


const SalesRegDebitors = () => {
  const accessDenied = checkPageAccess("Sales", "Reg Debitors 1");
  if (accessDenied) return accessDenied;

  const [debitorData, setDebitorData] = useState<DebitorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<{ FromDate?: string; ToDate?: string } | null>(null);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const handleSubmit1 = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        ...formData,
        IDS: formData.ID,
      };
      delete payload.ID;

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
        payload
      );
      await fetchData();

      setShowLedgerForm(false); // ✅ auto close after save
    } catch (err) {
      console.error("Ledger save failed:", err);
    }
  };

  // Table headers
  const headers = [
    { label: "S.No", key: "sno", dataType: "number" },
    { label: " Date", key: "BalanceDate", dataType: "date" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Opening", key: "OpeningBalance", dataType: "number" },
    { label: "Payable", key: "CreditAmount", dataType: "number" },
    { label: "Taxes", key: "Taxes", dataType: "number" },
    { label: "Paid", key: "PaidAmount", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];
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
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch API Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const response = await axios.get<DebitorEntry[]>(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=SalesDebitors1`
      );

      setDebitorData(response.data || []);
    } catch (error) {
      console.error("Error fetching debitor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];
  const handleViewMaterial = (deal: any) => {
    console.log("View Material:", deal.Party);
  };

  const handleViewTransport = (deal: any) => {
    console.log("Transport:", deal.Party);
  };
  const tableData = debitorData.map((row, index) => ({
    ...row,
    sno: index + 1,
  }));


  return (
    <div className="page-wrapper">
      <div className="content p-2">
        {appliedFilters && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "10px 15px",
              borderRadius: "6px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <strong>Applied Filters:</strong>

            <div style={{ marginTop: "5px" }}>
              {appliedFilters.Party && <span className="me-3">Party: {appliedFilters.Party}</span>}
              {appliedFilters.Material && <span className="me-3">Material: {appliedFilters.Material}</span>}
              {appliedFilters.FromDate && <span className="me-3">From: {appliedFilters.FromDate}</span>}
              {appliedFilters.ToDate && <span className="me-3">To: {appliedFilters.ToDate}</span>}
            </div>
          </div>
        )}
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
          <ProductionList title="Debitor Balance Report 1"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={tableData}
            onAddLedgerClick={hasPermission("Sales", "Reg Debitors", "Added") ? () => setShowLedgerForm(true) : undefined}   // ✅ ADD THIS
            handleView={(row) => console.log("VIEW", row)}
            renderRowActions={(deal: any) => (
              <>
                <button
                  className="btn btn-sm"
                  style={{
                    color: "#ffffff",
                    borderColor: "#0d6efd",
                    backgroundColor: "#0d6efd",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deal.__openMaterial();
                  }}
                >
                  View Material
                </button>

                <button
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "#fd7e14",
                    color: "#fff",
                    borderColor: "#fd7e14",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deal.__openTransport();
                  }}
                >
                  Transport
                </button>
              </>
            )}
          />
        )}

        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleSubmit1}
        />

      </div>
    </div>
  );
};

export default SalesRegDebitors;

