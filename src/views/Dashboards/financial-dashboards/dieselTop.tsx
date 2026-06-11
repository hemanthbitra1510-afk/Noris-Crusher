import { useState, useEffect } from "react";
import axios from "axios";
import DashboardList2 from "../../../components/reuse-components/dashboardList2";

interface DebitorDeal {
  Vehicle: string;
  Litres: number;
  Amount: number;
}

type SummaryResponse = DebitorDeal[];

const DieselTopList = () => {
  const [debitor, setDebitor] = useState<DebitorDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/FinanaceDashBoard.php?ID=${id}&Table=DieselTop10`
      );

      setDebitor(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDebitor([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP LOADING (smooth UX)
      }, 300);
    }
  };

  // ✅ Present day label
  const todayLabel = ` ${new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  const tableHeaders = [
    { Label: "Vehicle", Key: "Vehicle", Type: "string" },
    { Label: "Litres", Key: "Litres", Type: "number" },
    { Label: "Amount", Key: "Amount", Type: "Amount" },
  ];

  const columnTypes: { [key: string]: "string" | "number" | "Amount" } = {};
  tableHeaders.forEach(({ Key, Type }) => {
    columnTypes[Key] = Type;
  });

  return (
    <>
      {loading ? (
        <div
          style={{
            height: "250px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
          />
        </div>
      ) : debitor.length === 0 ? (
        <div className="text-center p-4 border rounded bg-light">
          <p className="m-0 text-muted">⛽ No diesel data available</p>
        </div>
      ) : (
        <DashboardList2
          title="Diesel Top"
          periodOptions={[todayLabel]}
          tableHeaders={tableHeaders}
          dealsData={debitor}
          linkField={undefined}
          statusField={undefined}
          linkRoute={undefined}
          columnTypes={columnTypes}
        />
      )}
    </>
  );
};

export default DieselTopList;

