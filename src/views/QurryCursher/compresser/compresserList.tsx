import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import Select from "react-select";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface DashboardListRow {
  [key: string]: string | number;
}

interface DebitorDeal extends DashboardListRow {
  ID: string;
  Compressor: string;
  Rate: string;
  One: string;
  OneFive: string;
  Two: string;
  TwoFive: string;
  Three: string;
  Four: string;
  FourFive: string;
  Five: string;
  Amount: string;
  Date1: string;
  Time1: string;
  TotalHoles: string;
}

type SummaryResponse = DebitorDeal[];

const CompresserList = () => {
  const accessDenied = checkPageAccess("Quarry", "Compressor");
  if (accessDenied) return accessDenied;

  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [showFilter, setShowFilter] = useState(true);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState({
    Compressor: "",
    FromDate: "",
    ToDate: getToday(),
  });

  const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1" },
    { label: "Time", key: "Time1" },
    { label: "Compressor", key: "Compressor" },

    { label: "1", key: "One", dataType: "number" },
    { label: "1.5", key: "OneFive", dataType: "number" },
    { label: "2", key: "Two", dataType: "number" },
    { label: "2.5", key: "TwoFive", dataType: "number" },
    { label: "3", key: "Three", dataType: "number" },
    { label: "4", key: "Four", dataType: "number" },
    { label: "4.5", key: "FourFive", dataType: "number" },
    { label: "5", key: "Five", dataType: "number" },

    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Total Holes", key: "TotalHoles", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
  ];

  useEffect(() => {
    apiGet();
  }, []);

  const [contractors, setContractors] = useState<Ledger[]>([]);

  const fetchContractors = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<Ledger[]>(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      const filteredContractors = (res.data || []);
      setContractors(filteredContractors);
    } catch (err) {
      console.error("Failed to load ledgers", err);
      setContractors([]);
    }
  };

  const compressorOptions = contractors.map((c) => ({
    value: c.Party,
    label: `${c.Party} (${c.Type})`, // ✅ show Type
  }));

  useEffect(() => {
    fetchContractors(); // ✅ renamed from fetchLedgers to match call source
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

  const apiGet = async () => {
    try {
      setLoading(true);

      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        Compressor: filters.Compressor,
        FromDate: filters.FromDate,
        ToDate: filters.ToDate,
      };

      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=CompressorData`,
        payload
      );

      setMaterialTop(res.data || []);
    } catch (err) {
      console.error("Error fetching compressor data:", err);
      setMaterialTop([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row: any) => {
    setEditIDS(row.ID); // ✅ EXISTING ROW ID

    setFormData({
      Compressor: row.Compressor || "",
      Quarry: (row as any).Quarry || "",
      Description: (row as any).Description || "",
      One: row.One || "",
      OneFive: row.OneFive || "",
      Two: row.Two || "",
      TwoFive: row.TwoFive || "",
      Three: row.Three || "",
      Four: row.Four || "",
      FourFive: row.FourFive || "",
      Five: row.Five || "",
      Rate: row.Rate || "",
      Amount: row.Amount || "",
      TotalHoles: row.TotalHoles || "",
      Date1: row.Date1,
    });

    setShowAddModal(true);
  };

  const handleSubmit1 = async (formData: any) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        ...formData,
        IDS: formData.ID, // backend expects IDS
      };
      delete payload.ID;

      await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
        payload
      );

      // ✅ close ledger form after save
      setShowLedgerForm(false);

    } catch (err) {
      console.error("Ledger save failed:", err);
    }
  };

  const handleDelete = async (row: any) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      await axios.post(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=CompressorDataDelete`,
        { IDS: row.ID }
      );
      apiGet();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  const filterUI = (
    <div className="row g-2 align-items-end w-100">
      <div className="col-md-4">
        <label className="form-label d-none">Compressor</label>
        <Select
          isSearchable
          isClearable
          placeholder="Compressor"
          options={compressorOptions}
          value={
            compressorOptions.find(
              (o) => o.value === filters.Compressor
            ) || null
          }
          onChange={(opt) =>
            setFilters({ ...filters, Compressor: opt ? opt.value : "" })
          }
        />
      </div>

      <div className="col-md-3">
        <input
          type="date"
          className="form-control"
          value={filters.FromDate}
          onChange={(e) =>
            setFilters({ ...filters, FromDate: e.target.value })
          }
        />
      </div>

      <div className="col-md-3">
        <input
          type="date"
          className="form-control"
          value={filters.ToDate}
          onChange={(e) =>
            setFilters({ ...filters, ToDate: e.target.value })
          }
        />
      </div>

      <div className="col-md-2">
        <button className="btn btn-primary w-100" onClick={apiGet}>
          Apply
        </button>
      </div>
    </div>
  );
  const [editIDS, setEditIDS] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    Compressor: "",
    Quarry: "",
    Description: "",
    One: "",
    OneFive: "",
    Two: "",
    TwoFive: "",
    Three: "",
    Four: "",
    FourFive: "",
    Five: "",
    Rate: "",
    Amount: "",
    TotalHoles: "",
    Date1: new Date().toISOString().split("T")[0],
  });

  const calculateAmount = (data: typeof formData) => {
    const total =
      (Number(data.One) || 0) * 1 +
      (Number(data.OneFive) || 0) * 1.5 +
      (Number(data.Two) || 0) * 2 +
      (Number(data.TwoFive) || 0) * 2.5 +
      (Number(data.Three) || 0) * 3 +
      (Number(data.Four) || 0) * 4 +
      (Number(data.FourFive) || 0) * 4.5 +
      (Number(data.Five) || 0) * 5;

    const rate = Number(data.Rate) || 0;

    return total * rate;
  };

  useEffect(() => {
    const calculatedAmount = calculateAmount(formData);

    setFormData(prev => ({
      ...prev,
      Amount: calculatedAmount.toString(),
    }));
  }, [
    formData.One,
    formData.OneFive,
    formData.Two,
    formData.TwoFive,
    formData.Three,
    formData.Four,
    formData.FourFive,
    formData.Five,
    formData.Rate,
  ]);

  interface Ledger {
    ID: string;
    Party: string;
    Type: string;
    Status: string;
  }

  const handleSave = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      await axios.post(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=CompressorDataSave`,
        {
          ...formData,
          IDS: editIDS, // ✅ EMPTY = ADD, VALUE = UPDATE
        }
      );

      setShowAddModal(false);
      apiGet();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // Bulk update removed

  const handleAddLedgerClick = () => {
    setShowLedgerForm(true);
  };

  // Declarations moved up to fix lint errors

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

          <ListComponent appliedFilters={filters}
            title="Compressor Report"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
            handleEdit={hasPermission("Quarry", "Compressor", "Updated") ? handleEdit : undefined}
            handleDelete={hasPermission("Quarry", "Compressor", "Deleted") ? handleDelete : undefined}
            handleShow={() => setShowFilter(true)}
            customFilter={showFilter && filterUI}
            onAddLedgerClick={hasPermission("Quarry", "Compressor", "Added") ? handleAddLedgerClick : undefined}
            onAddClick={hasPermission("Quarry", "Compressor", "Added") ? () => {
              setEditIDS("");
              fetchContractors();  // ✅ forces INSERT
              setShowAddModal(true);
            } : undefined}
            onBulkUpload={hasPermission("Quarry", "Compressor", "Added") ? async (data: any[]) => {
              const id = sessionStorage.getItem("selectedItems") ?? "";
              for (const item of data) {
                try {
                  await axios.post(
                    `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=CompressorDataSave`,
                    {
                      ...item,
                      IDS: ""
                    }
                  );
                } catch (err) {
                  console.error("Bulk upload error:", err);
                }
              }
            } : undefined}
            onSuccess={apiGet}
          />)}
        <AccountLedgerForm
          show={showLedgerForm}
          onClose={() => setShowLedgerForm(false)}
          initialData={null}
          handleSubmit1={handleSubmit1}
        />
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">Add Compressor Entry</h5>
                <button className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>

              <div className="modal-body">
                <div className="row g-3">

                  {/* Compressor */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Compressor</label>
                    <Select
                      isSearchable
                      placeholder="Select Contractor"
                      options={compressorOptions}
                      value={
                        compressorOptions.find(
                          (o) => o.value === formData.Compressor
                        ) || null
                      }
                      onChange={(opt) =>
                        setFormData({
                          ...formData,
                          Compressor: opt ? opt.value : "",
                        })
                      }
                    />


                  </div>

                  {/* Quarry */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Quarry</label>
                    <input className="form-control" placeholder="Quarry"
                      value={formData.Quarry}
                      onChange={e => setFormData({ ...formData, Quarry: e.target.value })}
                    />
                  </div>

                  {/* Date */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Date</label>
                    <input type="date" className="form-control"
                      value={formData.Date1}
                      onChange={e => setFormData({ ...formData, Date1: e.target.value })}
                    />
                  </div>

                  {/* ✅ DRILL SIZES */}
                  {[
                    ["One", "1"],
                    ["OneFive", "1.5"],
                    ["Two", "2"],
                    ["TwoFive", "2.5"],
                    ["Three", "3"],
                    ["Four", "4"],
                    ["FourFive", "4.5"],
                    ["Five", "5"],
                  ].map(([key, label]) => (
                    <div className="col-md-3" key={key}>
                      <label className="form-label fw-semibold">
                        Drill Size  ({label})
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={`Enter ${label}`}
                        value={(formData as any)[key] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [key]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}


                  {/* Rate */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Rate</label>
                    <input className="form-control" placeholder="Rate"
                      value={formData.Rate}
                      onChange={e => setFormData({ ...formData, Rate: e.target.value })}
                    />
                  </div>

                  {/* Total Holes */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Holes</label>
                    <input className="form-control" placeholder="Total Holes"
                      value={formData.TotalHoles}
                      onChange={e => setFormData({ ...formData, TotalHoles: e.target.value })}
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Amount</label>
                    <input
                      className="form-control bg-light"
                      placeholder="Amount"
                      value={formData.Amount}
                      readOnly
                    />

                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleSave}>
                  Save
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CompresserList;
