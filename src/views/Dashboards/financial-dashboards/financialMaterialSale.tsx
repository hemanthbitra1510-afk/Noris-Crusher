import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardList2 from '../../../components/reuse-components/dashboardList2';

interface DebitorDeal {
  Material: string;
  Nett: number;
}

type SummaryResponse = DebitorDeal[];

const MaterialTopList = () => {
  const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/FinanaceDashBoard.php?ID=${id}&Table=Materialtop10`
      );

      setMaterialTop(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMaterialTop([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP LOADING (smooth transition)
      }, 300);
    }
  };

  // Replace this
  // const periodOptions = ['Last 30 Days', 'Last 60 Days', 'Last 90 Days'];

  // With this
  const periodOptions = [
    ` ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
  ];

  // Updated tableHeaders with Label, Key, and Type
  const tableHeaders = [
    { Label: 'Material', Key: 'Material', Type: 'string' },
    { Label: 'Nett', Key: 'Nett', Type: 'net' },
  ];

  // Dynamically create columnTypes from tableHeaders
  const columnTypes: { [key: string]: 'string' | 'number' } = {};
  tableHeaders.forEach(({ Key, Type }) => {
    columnTypes[Key] = Type;
  });

  const formattedDeals = materialTop.map(item => ({
    Material: item.Material,
    Nett: item.Nett,
  }));

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
      ) : materialTop.length === 0 ? (
        <div className="text-center p-4 border rounded bg-light">
          <p className="m-0 text-muted">📦 No material data available</p>
        </div>
      ) : (
        <DashboardList2
          title="Top Material Sales"
          periodOptions={periodOptions}
          tableHeaders={tableHeaders}
          dealsData={formattedDeals}
          columnTypes={columnTypes}
        />
      )}
    </>
  );
};

export default MaterialTopList;

