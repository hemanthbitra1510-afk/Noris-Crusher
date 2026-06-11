import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import CashSearch from "./cashOutSerach";
import CashOutForm from "./cashOutForm";
import { useToast } from "../../../components/reuse-components/Toast";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import AccountCashOutSummary from "./AccountCashOutSummary";
interface DailyDeal {
  [key: string]: string | number | null | undefined;
  ID1: string;
  Date1: string;
  Names: string;       // Ledger
  Under: string;       // Sub-Ledger
  PaymentMode: string;
  Bank: string;
  Transfer: string;
  DebitAmount: string;
  Particular: string;
}

interface Filters {
  FromDate: string;
  ToDate: string;
  Party: string;
  PaymentMode: string;
  VoucherType: string;
}

type SummaryResponse = DailyDeal[];

const AccountCashOut = () => {
  const accessDenied = checkPageAccess("Accounts", "Cash Out");
  if (accessDenied) return accessDenied;

  const [cashOutList, setCashOutList] = useState<DailyDeal[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const showToast = useToast();

  const bulkUpdateFields = [
    { label: "Date", key: "Date1", type: "date" as const },
    { label: "Amount", key: "DebitAmount", type: "number" as const },
    { label: "Description", key: "Particular", type: "text" as const },
  ];

  const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await Promise.all(
        ids.map((sid) => {
          const row = cashOutList.find((m) => m.ID1 === sid);
          if (!row) return Promise.resolve();
          return axios.post(
            `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPaymentsSave`,
            {
              ...row,
              [field]: value,
              IDS: sid,
            }
          );
        })
      );
      showToast("Success", "Bulk update successful", "success");
      setSelectedIds([]);
      apiGet();
    } catch (err) {
      showToast("Error", "Bulk update failed", "danger");
    }
  };

  // TABLE HEADERS
  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Party (Ledger)", key: "Names", dataType: "string" },
    { label: "Voucher", key: "LedgerFamily", dataType: "string" },
    { label: "Sub-Ledger", key: "Under", dataType: "string" },
    { label: "Payment Mode", key: "Bank" },
    { label: "Description", key: "Particular", },
    // { label: "Bank", key: "Bank", dataType: "string" },
    { label: "Amount", key: "DebitAmount", dataType: "number" }
  ];

  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Party: "",
    PaymentMode: "",
    VoucherType: "",
  });

  // HANDLE SEARCH SUBMIT
  const handleSearchSubmit = (formData: Filters) => {
    setFilters(formData);
    apiGet(formData);
    setShowSearch(false);
  };

  // FETCH DATA
  const apiGet = async (filterParams: Filters = filters) => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPayments`,
        filterParams
      );

      setCashOutList(res.data || []);
    } catch (err) {
      console.error("Error fetching cash-out data:", err);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiGet(filters);
  }, []);

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

  const handleSummary = () => {
    setShowSummary(true);
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
  // SAVE LEDGER (from form)
  const handleSubmit1 = async (formData: any) => {
    try {

      // ✅ Remove account number from "BankName (1234)"
      const cleanedPaymentMode = formData.PaymentMode
        ?.replace(/\s*\(.*?\)\s*/g, "")
        ?.trim();

      const updated = {
        ...formData,
        PaymentMode: cleanedPaymentMode,
        Bank: cleanedPaymentMode,           // ✅ Also send as Bank as the table uses this key
        IDS: editData ? editData.ID1 : ""   // ✅ Only send ID1 during edit
      };

      delete updated.ID1;   // safety (if exists)

      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPaymentsSave`,
        updated
      );

      showToast("Success", "Ledger Saved Successfully!", "success");
      setShowForm(false);
      setEditData(null);
      apiGet();

    } catch (err) {
      showToast("Error", "Failed to save ledger.", "danger");
    }
  };


  const handleDelete = async (row: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPaymentsDelete`,
        { IDS: row.ID1 }   // ✅ SEND ID1
      );

      showToast("Success", "Deleted Successfully!", "success");
      apiGet();

    } catch (err) {
      showToast("Error", "Delete Failed.", "danger");
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  return (
    <div className="page-wrapper">
      <div className="content p-2">


        {/* LIST TABLE */}
        <ListComponent appliedFilters={filters}
          title="Cash Out - Party Payments"
          periodOptions={periodOptions}
          tableHeaders={headers as any}
          dealsData={cashOutList}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          idField="ID1"
          bulkUpdateFields={bulkUpdateFields}
          onBulkUpdateSave={handleBulkUpdateSave}
          handleShow={() => setShowSearch(true)}
          onAddClick={hasPermission("Accounts", "Cash Out", "Added") ? () => {
            setEditData(null);
            setShowForm(true);
          } : undefined}
          handleEdit={hasPermission("Accounts", "Cash Out", "Updated") ? (row: any) => {
            setEditData(row);
            setShowForm(true);
          } : undefined}
          onAddLedgerClick={hasPermission("Accounts", "Cash Out", "Added") ? () => setShowLedgerForm(true) : undefined}
          handleSummary={handleSummary}
          handleDelete={hasPermission("Accounts", "Cash Out", "Deleted") ? handleDelete : undefined}
        />

        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}

        />

        {/* SEARCH FILTER MODAL */}
        <CashSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleShow={() => setShowSearch(true)}
          handleSubmit={handleSearchSubmit}
        />

        {/* CASH OUT FORM (Add / Edit) */}
        <CashOutForm
          show={showForm}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          initialData={editData}
          handleSubmit1={handleSubmit1}
        />
        <AccountCashOutSummary
          show={showSummary}
          onClose={() => setShowSummary(false)}
          data={cashOutList}
        />
      </div>
    </div>
  );
};

export default AccountCashOut;

