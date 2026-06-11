import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DailyDeal {
  Date1: string;
  Boulders: number;
  Yard: string;
  TotalSales: string;
  YardSales: string;
  Balance: string;
}

type SummaryResponse = DailyDeal[];

const DailyList = () => {
  const accessDenied = checkPageAccess("Production", "Daily");
  if (accessDenied) return accessDenied;

  const [materialTop, setMaterialTop] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1", dataType: "string" },
    { label: "Boulders", key: "Boulders", dataType: "number" },
    { label: "Yard", key: "Yard", dataType: "number" },
    { label: "Total Sales", key: "TotalSales", dataType: "number" },
    { label: "Yard Sales", key: "YardSales", dataType: "number" },
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

      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Production.php?ID=${id}&TableName=ProductionDaily`
      );

      setMaterialTop(res.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMaterialTop([]);
    } finally {
      setLoading(false);
    }
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
          <ProductionList
            title="Daily Quarry Report"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={materialTop}
          />
        )}

      </div>
    </div>
  );
};

export default DailyList;

