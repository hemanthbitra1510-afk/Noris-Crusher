import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import YardReportSearch from "./YardReportSearch";
import YardSummary from "./YardSummary";
import ExcelUpload from "../../../components/reuse-components/exaclFileUpload";
import { Offcanvas, OffcanvasBody, OffcanvasHeader } from "react-bootstrap";
import BlukImport from "../../../components/reuse-components/blukImportOffCanvas";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface YardReport {
  DCNum: string;
  Date1: string;
  FirstDateTime: string;
  Gross: string;
  ID: string;
  Material: string;
  Nett: string;
  Tare: string;
  TareDate: string;
  TareTime: string;
  Time1: string;
  Vehicle: string;
}

const readOnlyEditFields = [
  "DCNum",
  "Date1",
  "Time1",
  "Nett",
  "TareDate",
  "TareTime",
  "ID",
  "FirstDateTime",
];


const calculateNett = (row: any) => {


  const gross = Number(row.Gross || 0);
  const tare = Number(row.Tare || 0);
  return (gross - tare).toString();
};


const YardReports = () => {
  const accessDenied = checkPageAccess("Yard", "Reports");
  if (accessDenied) return accessDenied;
  const [yardData, setYardData] = useState<YardReport[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    // String fields
    { label: "DC Number", key: "DCNum", dataType: "string" },
    // { label: "Date", key: "Date1", dataType: "string" },
    // { label: "Time", key: "Time1", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Gross", key: "Gross", dataType: "number" },
    { label: "Tare", key: "Tare", dataType: "number" },
    { label: "Tare Date", key: "TareDate", dataType: "number" },
    { label: "Tare Time", key: "TareTime", dataType: "string" },
    { label: "Net", key: "Nett", dataType: "number" },
  ];
  interface Filters {
    Vehicle: string;
    FromDate: string;
    ToDate: string;
    Material: string
  }

  const [filters, setFilters] = useState<Filters>({
    Vehicle: "",
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Material: ""
  });
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
      const res = await axios.post<YardReport[]>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=YardReport`,
        {
          Vehicle: filters.Vehicle || "",
          FromDate: filters.FromDate || "",
          ToDate: filters.ToDate || "",
          Material: filters.Material || ""
        }
      );
      console.log(res.data);
      setYardData(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching yard report data:", err);
    }
    finally {
      setLoading(false);
    }
  };

  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState<YardReport | null>(null);

  const handleEdit = (row: YardReport) => {
    setEditRow({ ...row }); // 👈 important (clone object)
    setShowEdit(true);
  };


  const updateYardReport = async () => {
    if (!editRow) return;

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      if (!id) {
        alert("ID missing");
        return;
      }

      const payload = {
        IDS: editRow.ID,          // ✅ REQUIRED
        Material: editRow.Material,
        Vehicle: editRow.Vehicle,
        Gross: editRow.Gross,
        Tare: editRow.Tare,
        Nett: editRow.Nett,
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=YardReportUpdate`,
        payload
      );

      // 🔄 Refresh list after save
      await apiGet();

      // ✅ Close edit canvas
      setShowEdit(false);
      setEditRow(null);

    } catch (error) {
      console.error("Update Yard Report failed:", error);
      alert("Failed to update yard report");
    }
  };



  const periodOptions = ["All", "This Month", "Last Month", "This Year"];
  const handleSearchSubmit = (formData: Filters) => {
    setAppliedFilters(formData);
    setFilters(formData);
    setShowSearch(false);
  };
  const handleSummary = () => {
    setShowSummary(true); // ✅ open summary offcanvas
  };
  const handleExcelSubmit = (data: any[]) => {
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      setExcelHeaders(keys);
      setExcelData(data);
      setShowImport(true); // open preview offcanvas
    }
    setShowExcelModal(false);
  };
  const handleImport = () => setShowExcelModal(true);
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
            title="Yard Report"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={yardData}
            handleImport={handleImport}
            handleEdit={hasPermission("Yard", "Reports", "Updated") ? handleEdit : undefined}
            appliedFilters={appliedFilters}
            handleShow={() => setShowSearch(true)}
            handleSummary={handleSummary} // ✅ now opens summary
          />
        )}
        <YardReportSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleShow={() => setShowSearch(true)}
          handleSubmit={handleSearchSubmit}
        />
        <YardSummary
          show={showSummary}
          onClose={() => setShowSummary(false)}
          data={yardData}
        />
        <ExcelUpload
          show={showExcelModal}
          onHide={() => setShowExcelModal(false)}
          onSubmit={handleExcelSubmit}
        />

        {/* Offcanvas Bulk Import Preview */}
        <Offcanvas
          show={showImport}
          onHide={() => setShowImport(false)}
          placement="end"
          style={{ width: "auto" }}
        >
          <OffcanvasHeader closeButton>
            <div>
              <h5 className="mb-0 text-primary">Bulk Import - Quarry Contractor</h5>
              <small className="text-muted">Preview Imported Excel Data</small>
            </div>
          </OffcanvasHeader>

          <OffcanvasBody>
            <BlukImport
              tableHeaders={excelHeaders.map(h => ({ label: h, key: h }))}
              dealsData={excelData}
              onUpload={(rows) => {
                console.log("Selected rows:", rows);
                uploadBulk(rows);
              }}
            />
          </OffcanvasBody>
        </Offcanvas>
        {/* ================= EDIT OFFCANVAS ================= */}
        {showEdit && (
          <>
            <div
              className="offcanvas-backdrop fade show"
              onClick={() => setShowEdit(false)}
            />

            <div className="offcanvas offcanvas-end show" style={{ width: "80%" }}>
              <div className="offcanvas-header">
                <h5 className="offcanvas-title">Edit Yard Report</h5>
                <button className="btn-close" onClick={() => setShowEdit(false)} />
              </div>

              <div className="offcanvas-body">
                {editRow ? (
                  <div className="row g-3">

                    {Object.entries(editRow).map(([key, value]) => {
                      const isReadOnly = readOnlyEditFields.includes(key);

                      return (
                        <div className="col-md-6" key={key}>
                          <label className="form-label">{key}</label>

                          <input
                            type="text"
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

                              setEditRow((prev) => {
                                if (!prev) return prev;

                                const updated = {
                                  ...prev,
                                  [key]: e.target.value,
                                };

                                // 🔄 AUTO CALCULATE NETT
                                if (key === "Gross" || key === "Tare") {
                                  updated.Nett = calculateNett(updated);
                                }

                                return updated;
                              });
                            }}

                          />
                        </div>
                      );
                    })}

                  </div>
                ) : (
                  <div className="text-center text-muted">No row selected</div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={updateYardReport}
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

export default YardReports;
