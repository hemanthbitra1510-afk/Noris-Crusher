import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import YardNormalSearch from "./YardNormalSerach";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// ✅ Updated interface with new fields
interface FuelReport {
  ID: string;
  SerialNo: string;
  Vehicle: string;
  Party: string;
  Material: string;
  Qty: string;
  Amount: string;
  Charges: string;
  Gross: string;
  GrossDate: string;
  GrossTime: string;
  Tare: string;
  TareDate: string;
  TareTime: string;
  Nett: string;
  FirstDateTime: string;
  SecondDateTime: string;
}

type SummaryResponse = FuelReport[];





const calculateNett = (row: FuelReport) => {

  const gross = Number(row.Gross || 0);
  const tare = Number(row.Tare || 0);
  return String(gross - tare);
};


const YardNormalWmt = () => {
  const accessDenied = checkPageAccess("Yard", "Normal Wmt");
  if (accessDenied) return accessDenied;

  const [reportData, setReportData] = useState<FuelReport[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [editRow, setEditRow] = useState<FuelReport | null>(null);
  const handleEdit = (row: FuelReport) => {
    setEditRow({ ...row }); // clone
    setShowEdit(true);
  };


  const updateNormalReport = async () => {
    if (!editRow) return;

    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const payload = {
        IDS: editRow.ID,   // 🔴 backend expects IDS
        Material: editRow.Material,
        Party: editRow.Party,
        Vehicle: editRow.Vehicle,
        Gross: editRow.Gross,
        Tare: editRow.Tare,
        Nett: editRow.Nett,
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=NormalReportUpdate`,
        payload
      );

      await apiGet();        // refresh table
      setShowEdit(false);
      setEditRow(null);

    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed");
    }
  };
  // ✅ ADD
  const calculateNett = (gross: string, tare: string) => {
    return String(Number(gross || 0) - Number(tare || 0));
  };

  // ✅ Table headers for the new data
  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Serial No", key: "SerialNo", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },

    // Numeric fields
    { label: "Gross", key: "Gross", dataType: "number" },
    { label: "Gross Date", key: "GrossDate", dataType: "string" },
    { label: "Gross Time", key: "GrossTime", dataType: "string" },

    { label: "Tare", key: "Tare", dataType: "number" },
    { label: "Tare Date", key: "TareDate", dataType: "string" },
    { label: "Tare Time", key: "TareTime", dataType: "string" },

    { label: "Nett", key: "Nett", dataType: "number" },
  ];
  interface Filters {
    FromDate: string;
    ToDate: string;
    Material: string;
    Vehicle: string;
    Party: string
  }

  const [filters, setFilters] = useState<Filters>({
    FromDate: "",
    ToDate: "",
    Material: "",
    Vehicle: "",
    Party: ""
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
      const res = await axios.post<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=NormalReport`, {
        FromDate: filters.FromDate,
        ToDate: filters.ToDate,
        Material: filters.Material,
        Vehicle: filters.Vehicle,
        Party: filters.Party
      }
      );
      setReportData(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchSubmit = (formData: Filters) => {
    setAppliedFilters(formData);
    setFilters(formData);
    setShowSearch(false);
  };
  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

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
            title="Fuel Report"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={reportData}
            handleEdit={hasPermission("Yard", "Normal Wmt", "Updated") ? handleEdit : undefined}
            appliedFilters={appliedFilters}
            handleShow={() => setShowSearch(true)}
          />
        )}
        <YardNormalSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleShow={() => setShowSearch(true)}
          handleSubmit={handleSearchSubmit}
        />

        {/* ================= EDIT OFFCANVAS ================= */}
        {showEdit && editRow && (
          <>
            <div
              className="offcanvas-backdrop fade show"
              onClick={() => setShowEdit(false)}
            />

            <div className="offcanvas offcanvas-end show" style={{ width: "80%" }}>
              <div className="offcanvas-header">
                <h5 className="offcanvas-title">Edit Fuel Report</h5>
                <button className="btn-close" onClick={() => setShowEdit(false)} />
              </div>

              <div className="offcanvas-body">
                <div className="row g-3">

                  {["Material", "Party", "Vehicle", "Gross", "Tare"].map((key) => (
                    <div className="col-md-6" key={key}>
                      <label className="form-label">{key}</label>
                      <input
                        className="form-control"
                        value={(editRow as any)[key]}
                        onChange={(e) => {
                          const updated = {
                            ...editRow,
                            [key]: e.target.value,
                          };

                          if (key === "Gross" || key === "Tare") {
                            updated.Nett = calculateNett(
                              updated.Gross,
                              updated.Tare
                            );
                          }

                          setEditRow(updated);
                        }}
                      />
                    </div>
                  ))}

                  {/* Nett (READ ONLY) */}
                  <div className="col-md-6">
                    <label className="form-label">Nett</label>
                    <input
                      className="form-control"
                      value={editRow.Nett}
                      readOnly
                      style={{ backgroundColor: "#f8f9fa" }}
                    />
                  </div>

                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={updateNormalReport}
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

export default YardNormalWmt;

