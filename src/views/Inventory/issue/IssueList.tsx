import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import MaterialIssueForm from "./IssueForm";
import IssueSerchModal from "./IssueSearch";
import SummaryOffcanvas from "./IssueSummary";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface MaterialIssue {
  [key: string]: string | number | null | undefined;
  ID: number;
  Ledger: string;
  Material: string;
  Payee: string;
  IssuedTo: string;
  Reading: string;
  Description: string;
  Qty: number;
  Rate: number;
  Amount: number;
  Date1: string;
}

type MaterialResponse = MaterialIssue[];

const IssueList = () => {
  const accessDenied = checkPageAccess("Inventory", "Issue");
  if (accessDenied) return accessDenied;

  const [materialList, setMaterialList] = useState<MaterialIssue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState<MaterialIssue | null>(null);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);


  const bulkUpdateFields = [
    { label: "Issued To", key: "Payee", type: "text" as const },
    { label: "Material", key: "Material", type: "text" as const },
    { label: "Rate", key: "Rate", type: "number" as const },
  ];

  const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const savePromises = ids.map((rowId) => {
        const originalRecord = materialList.find((r) => r.ID === rowId);
        if (!originalRecord) return Promise.resolve();

        const { ID, ...rest } = originalRecord;
        const payload = {
          ...rest,
          [field]: value,
          IDS: ID || "",
        };

        return axios.post(
          `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryDataSave`,
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
    Payee: "",
    Material: "",
    Ledger: "",
    FromDate: "",
    ToDate: "",
  });

  const showToast = useToast();

  const headers: any[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1" },
    { label: "Ledger", key: "Ledger" },
    { label: "Issued To", key: "Payee" },
    { label: "Receiver", key: "IssuedTo" },
    { label: "Material", key: "Material" },
    { label: "Reading", key: "Reading" },
    { label: "Description", key: "Description" },
    { label: "Qty", key: "Qty", dataType: "number" },
    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
  ];

  const apiGet = useCallback(async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post<MaterialResponse>(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryData`,
        {
          Payee: filters.Payee,
          Material: filters.Material,
          Ledger: filters.Ledger,
          FromDate: filters.FromDate,
          ToDate: filters.ToDate,
        }
      );
      setMaterialList(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    apiGet();
  }, [apiGet]);

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

  const handleLedgerSave = async (formData: Record<string, any>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const { ID, ...rest } = formData;
      const data = {
        ...rest,
        IDS: ID,
      };

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

  const handleAddClick = () => {
    setEditingData(null);
    setShowForm(true);
  };

  const handleEdit = (item: MaterialIssue) => {
    setEditingData(item);
    setShowForm(true);
  };

  const handleSummary = () => {
    setShowSummary(true); // ✅ open summary offcanvas
  };

  const handleAddMaterial = async (formData: Partial<MaterialIssue>) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const { ID, ...rest } = formData;
      const payload = {
        ...rest,
        IDS: ID || "",
      };

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryDataSave`,
        payload
      );

      console.log("Payload sent:", payload);
      console.log("Response:", res);

      showToast("Success", "Material issue saved successfully!", "success");
      apiGet();
      setShowForm(false);
    } catch (err) {
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleDelete = async (item: MaterialIssue) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryDataDelete`,
        { IDS: item.ID, _method: "DELETE" }
      );

      showToast("Success", "Material issue deleted successfully!", "success");
      apiGet();
    } catch (err) {
      console.error("Error deleting material issue:", err);
      showToast("Error", "Something went wrong. Please try again.", "danger");
    }
  };

  const handleSearchSubmit = (formData: typeof filters) => {
    setFilters(formData);
    setShowSearch(false);
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

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
          <div style={{ overflowY: "auto" }}>
            <ListComponent
              title="Material Issues"
              periodOptions={periodOptions}
              tableHeaders={headers as any}
              dealsData={materialList}
              onAddClick={hasPermission("Inventory", "Issue", "Added") ? handleAddClick : undefined}
              handleDelete={hasPermission("Inventory", "Issue", "Deleted") ? handleDelete as any : undefined}
              handleEdit={hasPermission("Inventory", "Issue", "Updated") ? handleEdit as any : undefined}
              handleShow={() => setShowSearch(true)}
              handleSummary={handleSummary}
              appliedFilters={filters}
              onAddLedgerClick={hasPermission("Inventory", "Issue", "Added") ? () => setShowLedgerForm(true) : undefined}

              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              bulkUpdateFields={bulkUpdateFields}
              onBulkUpdateSave={handleBulkUpdateSave}
            />


          </div>
        )}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleLedgerSave}
        />
        <MaterialIssueForm
          show={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAddMaterial}
          initialData={editingData}
        />

        <IssueSerchModal
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleShow={() => setShowSearch(true)}
          handleSubmit={handleSearchSubmit}
        />

        <SummaryOffcanvas
          show={showSummary}
          onClose={() => setShowSummary(false)}
          data={materialList} // ✅ send material issues for grouping
        />
      </div>
    </div>
  );
};

export default IssueList;

