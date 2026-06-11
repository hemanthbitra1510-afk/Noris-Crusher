import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardList2 from '../../../components/reuse-components/dashboardList2';

interface Diesel {
  Vehicle: string;
  Litres: number;
  Amount: number;
}

type SummaryResponse = Diesel[];

const TodayDiesel = () => {
  const [diesel, setDiesel] = useState<Diesel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/MaterialDashBoard.php?ID=${id}&Table=TodayDiesel`
      );

      setDiesel(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDiesel([]);
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


  // Updated tableHeaders as array of objects with Label, Key, and Type
  const tableHeaders = [
    { Label: 'Vehicle', Key: 'Vehicle', Type: 'string' },
    { Label: 'Litres', Key: 'Litres', Type: 'number' },
    { Label: 'Amount', Key: 'Amount', Type: 'Amount' },
  ];

  // Generate columnTypes dynamically
  const columnTypes: { [key: string]: 'string' | 'number' } = {};
  tableHeaders.forEach(({ Key, Type }) => {
    columnTypes[Key] = Type;
  });

  const formattedDeals = diesel.map(item => ({
    Vehicle: item.Vehicle,
    Litres: item.Litres,
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
      ) : diesel.length === 0 ? (
        <div className="text-center p-4 border rounded bg-light">
          <p className="m-0 text-muted">⛽ No diesel data available</p>
        </div>
      ) : (
        <DashboardList2
          title="Today Diesel"
          periodOptions={periodOptions}
          tableHeaders={tableHeaders}
          dealsData={formattedDeals}
          columnTypes={columnTypes}
        />
      )}
    </>
  );
};

export default TodayDiesel;

