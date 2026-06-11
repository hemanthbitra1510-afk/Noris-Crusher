import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import DieselIssueForm from "./DieselIssueForm";
import DieselIssueSearchModal from "./DieselIssueSearch";
import DieselSummaryOffcanvas from "./DieselSummary";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
interface DieselIssue {
  [key: string]: string | number | null | undefined;
  ID: number;
  Amount: string;
  Approve: string;
  ApprovedBy: string;
  Bunk: string;
  BunkReading: string;
  DCNo: string;
  Date1: string;
  DateTime: string;
  Driver: string;
  Filling: string;
  FirstDateTime: string;
  Litres: string;
  Operator: string;
  Rate: string;
  Reading: string;
  Time1: string;
  Transfer: string;
  Vehicle: string;
}

type DieselResponse = DieselIssue[];

const DieselIssueList = () => {
  const [showForm, setShowForm] = useState(false);
  const [dieselList, setDieselList] = useState<DieselIssue[]>([]);
  const [editingData, setEditingData] = useState<DieselIssue | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const accessDenied = checkPageAccess("Diesel", "Issue");


  const bulkUpdateFields = [
    { label: "Vehicle", key: "Vehicle", type: "text" as const },
    { label: "Driver", key: "Driver", type: "text" as const },
    { label: "Rate", key: "Rate", type: "number" as const },
  ];

  const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const savePromises = ids.map((rowId) => {
        // ✅ Fix: Handle potential string vs number ID mismatch
        const originalRecord = dieselList.find((r) => String(r.ID) === String(rowId));
        if (!originalRecord) return Promise.resolve();

        const { ID, ...rest } = originalRecord;
        const payload = {
          ...rest,
          [field]: value,
          IDS: ID,
        };

        // ✅ Even in bulk update, send Driver as Party
        if (field === "Driver") {
          (payload as any).Party = value;
        } else if (field === "Party") {
          (payload as any).Driver = value;
        }

        return axios.post(
          `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselDataSave`,
          payload
        );
      });

      await Promise.all(savePromises);
      showToast("Success", "Bulk update completed successfully!", "success");
      setSelectedIds([]);
      apiGet();
    } catch (err) {
      console.error("Bulk update failed:", err);
      showToast("Error", "Bulk update failed. Please try again.", "danger");
    }
  };


  const [filters, setFilters] = useState({
    Vehicle: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
  });

  const showToast = useToast();

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1" },
    { label: "Time", key: "Time1" },
    { label: "Vehicle", key: "Vehicle" },
    { label: "Party", key: "Driver" },
    { label: "Reading", key: "Reading" },
    { label: "Bunk Reading", key: "BunkReading" },
    { label: "Litres", key: "Litres", dataType: "number" },
    { label: "Rate", key: "Rate", dataType: "number", showTotal: false },
    { label: "Amount", key: "Amount", dataType: "number" },
  ];

  useEffect(() => {
    if (accessDenied) return;
    apiGet();
  }, [filters, accessDenied]);

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
    setShowSummary(true); // ✅ open summary offcanvas
  };

  const apiGet = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post<DieselResponse>(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselData`,
        filters // ✅ send filters in POST body
      );
      setDieselList(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    }
  };

  const handleDelete = async (item: DieselIssue) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselDataDelete`,
        { IDS: item.ID, _method: "DELETE" }
      );

      showToast("Success", "Diesel issue deleted successfully!", "success");
      apiGet();
    } catch (err) {
      console.error("Error deleting diesel issue:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
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
  const handleAddMaterial = async (formData: Partial<DieselIssue>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const payload = {
        ...formData,
        IDS: formData.ID,
      };
      delete (payload as any).ID;

      // ✅ Synchronize Driver and Party even in single edit
      if (formData.Party) {
        (payload as any).Driver = formData.Party;
      } else if (formData.Driver) {
        (payload as any).Party = formData.Driver;
      }

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselDataSave`,
        payload
      );
      console.log("Save response:", res);

      showToast("Success", "Diesel issue saved successfully!", "success");
      apiGet();
      setShowForm(false);
    } catch (err) {
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleSearchSubmit = (formData: typeof filters) => {
    setFilters(formData);
    setShowSearch(false);
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  if (accessDenied) return accessDenied;

  return (
    <div className="page-wrapper">
      <div className="content p-2">
        <ListComponent
          title="Diesel Issues"
          periodOptions={periodOptions as any}
          tableHeaders={headers as any}
          dealsData={dieselList as any}
          onAddClick={hasPermission("Diesel", "Issue", "Added") ? () => {
            setEditingData(null);
            setShowForm(true);
          } : undefined}
          handleDelete={hasPermission("Diesel", "Issue", "Deleted") ? handleDelete as any : undefined}
          handleEdit={hasPermission("Diesel", "Issue", "Updated") ? ((item: any) => {
            setEditingData(item);
            setShowForm(true);
          }) as any : undefined}
          handleSummary={handleSummary} // ✅ now opens summary
          onAddLedgerClick={hasPermission("Diesel", "Issue", "Added") ? () => setShowLedgerForm(true) : undefined}
          handleShow={() => setShowSearch(true)}
          appliedFilters={filters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkUpdateFields={bulkUpdateFields}
          onBulkUpdateSave={handleBulkUpdateSave}
          onSuccess={apiGet}
        />

        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />
        {/* Add/Edit Form */}
        <DieselIssueForm
          show={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingData(null);
          }}
          onSubmit={handleAddMaterial}
          initialData={editingData}
        />
        <DieselIssueSearchModal
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleSubmit={handleSearchSubmit}
        />
        <DieselSummaryOffcanvas
          show={showSummary}
          onClose={() => setShowSummary(false)}
          data={dieselList}
        />
      </div>
    </div>
  );
};

export default DieselIssueList;

