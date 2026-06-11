import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import { Button } from "react-bootstrap";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface StockItem {
  Material: string;
  "Opening Balance": number;
  Yard: number | null;
  Sales: number | null;
  Closing: number;
}

type StockResponse = StockItem[];

interface Filters {
  FromDate: string;
  ToDate: string;
}

const YardStock = () => {
  const accessDenied = checkPageAccess("Yard", "Summary");
  if (accessDenied) return accessDenied;

  const [stockData, setStockData] = useState<StockItem[]>([]);

  const [filters, setFilters] = useState<Filters>({
    FromDate: "",
    ToDate: "",
  });

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Opening", key: "Opening Balance", dataType: "number" },
    { label: "Yard", key: "Yard", dataType: "number" },
    { label: "Sales", key: "Sales", dataType: "number" },
    { label: "Closing", key: "Closing", dataType: "number" },
  ];

  useEffect(() => {
    fetchStockData();
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

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<StockResponse>(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=YardSummary`,
        {
          FromDate: filters.FromDate || "",
          ToDate: filters.ToDate || "",
        }
      );

      setStockData(res.data || []);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };
  const [loading, setLoading] = useState<boolean>(true);

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  /* ================= INLINE FILTER UI ================= */

  const filterUI = (
    <div className="row g-2 align-items-end w-100">
      <div className="col-md-4">
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

      <div className="col-md-4">
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

      <div className="col-md-4">
        <Button className="w-100" onClick={fetchStockData}>
          Apply
        </Button>
      </div>
    </div>
  );

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
          <ProductionList appliedFilters={filters}
            title="Yard Stock Summary"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={stockData}
            customFilter={filterUI}
          />
        )}
      </div>
    </div>
  );
};

export default YardStock;

