import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface Weightbridge {
  Date: string;
  Vehicle: string;
  Party: string;
  Gross: string;
  Tare: string;
  Nett: string;
  Rate: string;
  Amount: string;
  Payment: string;
  ID: string;
  [key: string]: any;
}

interface Filters {
  FromDate: string;
  ToDate: string;
  Payment: string;
}

const Weightbridge = () => {
  const accessDenied = checkPageAccess("Accounts", "Weighbridge-Cash");
  if (accessDenied) return accessDenied;

  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<Weightbridge[]>([]);
  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Payment: "",
  });

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Payable", key: "Payable", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  useEffect(() => {
    apiGet();
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

      if (!id) {
        showToast("Error", "Company ID not found", "danger");
        return;
      }

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=WighbridgeCashReports`,
        filters
      );

      setWeightData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching weightbridge:", err);
      showToast("Error", "Failed to fetch weightbridge reports", "danger");
    }
    finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = () => {
    apiGet();
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
            title="Weightbridge Cash Reports"
            periodOptions={["All", "This Month", "Last Month", "This Year"]}
            tableHeaders={headers}
            dealsData={weightData}
            handleShow={() => { }}
            customFilter={
              <div className="row g-3 align-items-end">

                <div className="col-md-3">
                  <label className="form-label">From Date</label>
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
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.ToDate}
                    onChange={(e) =>
                      setFilters({ ...filters, ToDate: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Payment</label>
                  <select
                    className="form-select"
                    value={filters.Payment}
                    onChange={(e) =>
                      setFilters({ ...filters, Payment: e.target.value })
                    }
                  >
                    <option value="All">All</option>
                    <option value="CASH">CASH</option>
                    <option value="Scanner">Scanner</option>
                  </select>
                </div>

                {/* ✅ APPLY BUTTON BESIDE PAYMENT */}
                <div className="col-md-2">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleFilterSubmit}
                  >
                    Apply
                  </button>
                </div>

              </div>
            }
          />
        )}


      </div>
    </div>
  );
};

export default Weightbridge;
