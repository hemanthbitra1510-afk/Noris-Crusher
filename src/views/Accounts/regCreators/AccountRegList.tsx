import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// ✅ Define the new structure for each row
interface AccountData {
  ID?: string | number;
  Party: string;
  Opening: string;
  Credit: string;
  Paid: string;
  Balance: number;
  BalanceDate: string | null;
  [key: string]: any;
}

type AccountResponse = AccountData[];

const AccountRegList = () => {
  const accessDenied = checkPageAccess("Accounts", "Reg Creditors");
  if (accessDenied) return accessDenied;

  const [accountData, setAccountData] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<any | null>(null);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  // ✅ Updated headers
  const headers = [
    { label: "S.No", key: "sno", type: "index" },
    { label: "Date", key: "BalanceDate", type: "string" },
    { label: "Ledger", key: "Party", type: "string" },
    { label: "Opening", key: "Opening", dataType: "number" },
    { label: "Credit", key: "Credit", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  useEffect(() => {
    // ✅ ADD animation keyframes here
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    const loadData = async () => {
      setLoading(true);

      try {
        await apiGet();
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const apiGet = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<AccountResponse>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=CreditorsList`
      );
      setAccountData(res.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };
  const handleLedgerSave = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const data = {
        ...formData,
        IDS: formData.ID,
      };
      delete data.ID;

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
        data
      );

      setShowLedgerForm(false);
      apiGet();
    } catch (err) {
      console.error("Ledger save failed:", err);
    }
  };

  // Bulk update removed

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
              {appliedFilters.Vehicle && <span className="me-3">Vehicle: {appliedFilters.Vehicle}</span>}
              {appliedFilters.Driver && <span className="me-3">Driver: {appliedFilters.Driver}</span>}
              {appliedFilters.Transporter && <span className="me-3">Transporter: {appliedFilters.Transporter}</span>}
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
          <ProductionList
            title="Account Register"
            periodOptions={periodOptions}
            tableHeaders={headers as any}
            dealsData={accountData}
            onAddLedgerClick={hasPermission("Accounts", "Regcreators", "Added") ? () => setShowLedgerForm(true) : undefined}
          />
        )}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />

      </div>
    </div>
  );
};

export default AccountRegList;

