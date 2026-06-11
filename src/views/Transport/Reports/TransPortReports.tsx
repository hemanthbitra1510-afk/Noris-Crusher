import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import TransPortReportSearch from "./TransPortReportSearch";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface TransporterReport {
  [key: string]: string | number | null | undefined;
  DCNum?: string;
  Date1?: string;
  Time1?: string;
  Vehicle?: string;
  Party?: string;
  Material?: string;
  Destination?: string;
  Transporter?: string;
  Gross?: string;
  Tare?: string;
  Nett?: string;
  TRate?: string;
  Measurement?: string;
  TransporterAmount?: string;
  Paid?: number;
  Balance?: number;
  ID?: string;
}

type SummaryResponse = TransporterReport[];

interface Filters {
  FromDate: string;
  ToDate: string;
  Party?: string;
  Material?: string;
  Vehicle?: string;
  Driver?: string;
  Transporter?: string;
}
const hiddenEditFields = [
  "Date1",
  "Time1",
  "FirstDateTime",
  "ID",
  "Typed",
];

const readOnlyEditFields = ["DCNum", "Date1", "Time1", "Vehicle", "Party", "Material", "Destination", "Gross", "Tare", "Source", "Driver", "Nett"];

const TransPortReports = () => {
  const accessDenied = checkPageAccess("Transporter", "Reports");
  if (accessDenied) return accessDenied;

  const [reportData, setReportData] = useState<TransporterReport[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const showToast = useToast();

  const bulkUpdateFields = [
    { label: "Transporter", key: "Transporter", type: "text" as const },
    { label: "TRate", key: "TRate", type: "number" as const },
  ];
  const handleEdit = (row: any) => {
    const updatedRow = {
      ...row,
      Measurement: row.Measurement || "Tonnes", // ✅ default
    };

    // 🔄 auto-calculate immediately on open
    updatedRow.TransporterAmount =
      calculateTransporterAmount(updatedRow);

    setEditRow(updatedRow);
    setShowEdit(true);
  };

  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Transporter: "",
  });

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "DCNum", key: "DCNum", dataType: "string", display: true },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Time", key: "Time1", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Destination", key: "Destination", dataType: "string" },
    { label: "Source", key: "Source", dataType: "string" },     // ✅ ADD
    { label: "Driver", key: "Driver", dataType: "string" },
    { label: "Transporter", key: "Transporter", dataType: "string" },
    { label: "Gross", key: "Gross", dataType: "string" },
    { label: "Tare", key: "Tare", dataType: "string" },
    { label: "Nett", key: "Nett", dataType: "string" },
    { label: "TRate", key: "TRate", dataType: "string" },
    // { label: "Measurement", key: "Measurement", dataType: "string" },
    { label: "TransporterAmount", key: "TransporterAmount", dataType: "string" },
  ];
  const handleSearchSubmit = (formData: Filters) => {
    setAppliedFilters(formData);
    setFilters(formData);
    setShowSearch(false);
  };

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
  }, [filters]);

  const apiGet = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=TransportersReport`,
        filters
      );

      setReportData(res.data || []);
    } catch (err) {
      console.error("Error fetching transporter report:", err);
    }
    finally {
      setLoading(false);
    }
  };

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];


  const calculateTransporterAmount = (row: any) => {
    const nett = Number(row.Nett || 0);
    const rate = Number(row.TRate || 0);

    if (row.Measurement === "Tonnes") {
      return ((nett / 1000) * rate).toFixed(2);
    }

    if (row.Measurement === "Vehicle") {
      return rate.toFixed(2);
    }

    return row.TransporterAmount || "";
  };

  const updateWeighmentRecord = async () => {
    if (!editRow) return;

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      if (!id) {
        alert("ID missing");
        return;
      }

      const payload = {
        IDS: editRow.ID,                     // ✅ required
        Typed: editRow.Typed,                // ✅ required
        Transporter: editRow.Transporter ?? "",
        Rate: editRow.TRate ?? "",           // ⚠️ backend expects Rate
        Nett: editRow.Nett ?? "",
        TransporterAmount: editRow.TransporterAmount ?? "",
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=UpdateWeighmentRecord`,
        payload
      );

      // 🔄 Refresh table
      await apiGet();

      // ✅ Close edit offcanvas
      setShowEdit(false);
      setEditRow(null);

    } catch (error) {
      console.error("Update Weighment failed:", error);
      alert("Failed to update weighment record");
    }
  };

  const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const updatePromises = ids.map(recordId => {
        const deal = reportData.find(d => (d as any).ID === recordId);
        if (!deal) return Promise.resolve();

        // Match TRate to Rate if that's what backend expects
        const updateField = field === "TRate" ? "Rate" : field;

        return axios.post(
          `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=UpdateWeighmentRecord`,
          {
            ...deal,
            IDS: recordId,
            [updateField]: value
          }
        );
      });

      await Promise.all(updatePromises);
      showToast("Success", `Updated ${ids.length} records successfully`, "success");
      setSelectedIds([]);
      apiGet();
    } catch (err) {
      console.error("Bulk update failed:", err);
      showToast("Error", "Failed to update some records", "danger");
    }
  };

  // Removed placeholder showToast




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
            title="Transporter Report"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={reportData}
            handleEdit={hasPermission("Transporter", "Reports", "Updated") ? handleEdit : undefined}
            appliedFilters={appliedFilters}
            handleShow={() => setShowSearch(true)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            bulkUpdateFields={bulkUpdateFields}
            onBulkUpdateSave={handleBulkUpdateSave}
          />
        )}
        <TransPortReportSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleShow={() => setShowSearch(true)}
          handleSubmit={handleSearchSubmit}
        />
        {/* ================= EDIT OFFCANVAS ================= */}
        {showEdit && (
          <>
            {/* Backdrop */}
            <div
              className="offcanvas-backdrop fade show"
              onClick={() => setShowEdit(false)}
            />

            {/* Offcanvas */}
            <div
              className="offcanvas offcanvas-end show"
              style={{ width: "80%" }}
            >
              <div className="offcanvas-header">
                <h5 className="offcanvas-title">Edit Transport Report</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEdit(false)}
                />
              </div>

              <div className="offcanvas-body">
                {editRow ? (
                  <div className="row g-3">

                    {/* 🔹 ALL FIELDS EXCEPT Measurement */}
                    {headers
                      .filter(
                        h =>
                          !hiddenEditFields.includes(h.key) &&
                          h.key !== "sno" &&
                          h.key !== "TransporterAmount" &&
                          h.key !== "TRate"
                      )
                      .map((header) => {
                        const key = header.key;
                        const value = editRow[key];
                        const isReadOnly = readOnlyEditFields.includes(key);

                        return (
                          <div className="col-md-6" key={key}>
                            <label className="form-label">{header.label}</label>

                            {key === "Measurement" ? (
                              <select
                                className="form-select"
                                value={value ?? ""}
                                onChange={(e) => {
                                  if (isReadOnly) return;

                                  setEditRow({
                                    ...editRow,
                                    [key]: e.target.value,
                                  });
                                }}
                              >
                                <option value="">Select Measurement</option>
                                <option value="Tonnes">Tonnes</option>
                                <option value="Vehicle">Vehicle</option>
                              </select>
                            ) : (
                              <input
                                className="form-control"
                                value={value ?? ""}
                                readOnly={isReadOnly}
                                disabled={isReadOnly}
                                style={
                                  isReadOnly
                                    ? { backgroundColor: "#f8f9fa" }
                                    : {}
                                }
                                onChange={(e) => {
                                  if (isReadOnly) return;

                                  const updated = {
                                    ...editRow,
                                    [key]: e.target.value,
                                  };

                                  // 🔄 Auto calculation trigger
                                  if (
                                    key === "TRate" ||
                                    key === "Nett"
                                  ) {
                                    updated.TransporterAmount =
                                      calculateTransporterAmount(updated);
                                  }

                                  setEditRow(updated);
                                }}
                              />
                            )}
                          </div>
                        );
                      })}

                    {/* 🔹 Measurement (ALWAYS LAST) */}
                    {/* 🔹 TRate (Manual Placement) */}
                    <div className="col-md-6">
                      <label className="form-label">TRate</label>
                      <input
                        className="form-control"
                        value={editRow.TRate ?? ""}
                        onChange={(e) => {
                          const updated = {
                            ...editRow,
                            TRate: e.target.value,
                          };

                          updated.TransporterAmount =
                            calculateTransporterAmount(updated);

                          setEditRow(updated);
                        }}
                      />
                    </div>

                    {/* 🔹 Measurement (AFTER TRate) */}
                    <div className="col-md-6">
                      <label className="form-label">Measurement</label>
                      <select
                        className="form-select"
                        value={editRow.Measurement || ""}
                        onChange={(e) => {
                          const updated = {
                            ...editRow,
                            Measurement: e.target.value,
                          };

                          updated.TransporterAmount =
                            calculateTransporterAmount(updated);

                          setEditRow(updated);
                        }}
                      >
                        <option value="Tonnes">Tonnes</option>
                        <option value="Vehicle">Vehicle</option>
                      </select>
                    </div>

                    {/* 🔹 TransporterAmount (ALWAYS LAST) */}
                    <div className="col-md-6">
                      <label className="form-label">TransporterAmount</label>
                      <input
                        className="form-control"
                        value={editRow.TransporterAmount ?? ""}
                        onChange={(e) =>
                          setEditRow({
                            ...editRow,
                            TransporterAmount: e.target.value,
                          })
                        }
                      />
                    </div>

                  </div>
                ) : (
                  <div className="text-muted text-center">
                    No row selected
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={updateWeighmentRecord}
                  >
                    Save
                  </button>

                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TransPortReports;
