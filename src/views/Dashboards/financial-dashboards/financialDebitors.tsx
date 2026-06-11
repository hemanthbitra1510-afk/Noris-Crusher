import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardList from '../../../components/reuse-components/dashboardList';
import DashboardList2 from '../../../components/reuse-components/dashboardList2';

interface DebitorDeal {
  Party: string;
  Nett: number;
  Amount: number;
}

const FinancialDebitors = () => {
  const [debitor, setDebitor] = useState<DebitorDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<DebitorDeal[]>(
        `https://norisapi.noris.in/Crusher/FinanaceDashBoard.php?ID=${id}&Table=PartyTop10`
      );

      setDebitor(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDebitor([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP LOADING (smooth transition)
      }, 300);
    }
  };

  const periodOptions = [
    `${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
  ];

  // Change tableHeaders to array of objects with Label, Key, Type
  const tableHeaders = [
    { Label: 'Party', Key: 'Party', Type: 'string' },
    { Label: 'Nett', Key: 'Nett', Type: 'net' },
    { Label: 'Amount', Key: 'Amount', Type: 'Amount' }
  ];

  // Create columnTypes for quick lookup
  const columnTypes: { [key: string]: 'string' | 'number' } = {};
  tableHeaders.forEach(({ Key, Type }) => {
    columnTypes[Key] = Type;
  });

  const formattedDeals = debitor.map(item => ({
    Party: item.Party,
    Nett: item.Nett,
    Amount: item.Amount,
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
      ) : debitor.length === 0 ? (
        <div className="text-center p-4 border rounded bg-light">
          <p className="m-0 text-muted">📊 No debitor data available</p>
        </div>
      ) : (
        <DashboardList2
          title="Top Debitors"
          periodOptions={periodOptions}
          tableHeaders={tableHeaders}
          dealsData={formattedDeals}
          columnTypes={columnTypes}
        />
      )}
    </>
  );
};

export default FinancialDebitors;

