import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import AccountJournalSearch from "./AccountJournalSerach";
import AccountJournalForm from "./AccountJournalForm";
import ListComponent from "../../../components/reuse-components/listComponent";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
/* ================= TYPES ================= */

interface JournalSummary {
  JVNumber: string;
  Date1: string;
  Particular: string;
  TotalCredit: string;
  TotalDebit: string;
}

interface Filters {
  FromDate: string;
  ToDate: string;
}

/* ================= COMPONENT ================= */

const AccountJourmal = () => {
  const accessDenied = checkPageAccess("Accounts", "Journals");
  if (accessDenied) return accessDenied;

  const [listData, setListData] = useState<JournalSummary[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedJV, setSelectedJV] = useState<any[]>([]);
  const periodOptions = ["All", "This Month", "Last Month", "This Year"];
  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  /* ================= TABLE HEADERS ================= */

  const headers: any[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "JV No", key: "JVNumber", dataType: "string" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Particular", key: "Particular", dataType: "string" },
    { label: "Debit", key: "SUM(Debited)", dataType: "number" },
    { label: "Credit", key: "SUM(Credited)", dataType: "number" },
  ];

  /* ================= LOAD LIST ================= */

  useEffect(() => {
    apiGet();
  }, [filters]);
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
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<JournalSummary[]>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyJournals`,
        filters
      );
      console.log(res)
      setListData(res.data);
    } catch (err) {
      console.error("List API error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchSubmit = (formData: Filters) => {
    setFilters(formData);
    setShowSearch(false);
  };
  const onAddClick = () => {
    console.log('zjvjfvjfvaj')
    setSelectedJV([]);
    setShowForm(true);
  };
  const handleSaveJournal = async (payload: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyJournalSave`,
        payload
      );

      console.log("SAVE RESPONSE", res.data);
      setShowForm(false);
      apiGet();
    } catch (error) {
      console.error("Save Journal Error:", error);
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
  const handleEdit = async (row: JournalSummary) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<any[]>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyJournalsDetails`,
        {
          JVNumber: row.JVNumber,
          Date1: row.Date1,
        }
      );

      setSelectedJV(res.data || []);
      setShowForm(true);
    } catch (err) {
      console.error("Edit API error:", err);
    }
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
          <ListComponent appliedFilters={filters}
            title="Account Journals"
            tableHeaders={headers}
            dealsData={listData}
            handleShow={() => setShowSearch(true)}
            handleEdit={hasPermission("Accounts", "Journals", "Updated") ? handleEdit : undefined}
            onAddClick={hasPermission("Accounts", "Journals", "Added") ? onAddClick : undefined}
            periodOptions={periodOptions}
            onAddLedgerClick={hasPermission("Accounts", "Journals", "Added") ? () => setShowLedgerForm(true) : undefined}

          />
        )}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />
        <AccountJournalSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleSubmit={handleSearchSubmit}
        />

        <AccountJournalForm
          show={showForm}
          onClose={() => setShowForm(false)}
          initialData={selectedJV}
          onSave={handleSaveJournal}
        />
      </div>
    </div>
  );
};

export default AccountJourmal;

