import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardList from '../../../components/reuse-components/dashboardList';
import DashboardList2 from '../../../components/reuse-components/dashboardList2';

interface TodayBoulders {
  DCNum: string;
  Time1: number;
  Vehicle: string;
  Nett: number;
}

type SummaryResponse = TodayBoulders[];

const TodayBoulders = () => {
  const [boulders, setBoulders] = useState<TodayBoulders[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    apiGet();
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true); // ✅ START LOADING

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/MaterialDashBoard.php?ID=${id}&Table=TodayBoulders`
      );

      setBoulders(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setBoulders([]);
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


  const tableHeaders = [
    { Label: 'DC Number', Key: 'DCNum', Type: 'string' },
    { Label: 'Time', Key: 'Time1', Type: 'string' },
    { Label: 'Vehicle', Key: 'Vehicle', Type: 'string' },
    { Label: 'Nett', Key: 'Nett', Type: 'net' },
  ];

  // Dynamically build columnTypes
  const columnTypes: { [key: string]: 'string' | 'number' } = {};
  tableHeaders.forEach(({ Key, Type }) => {
    columnTypes[Key] = Type;
  });

  const formattedDeals = boulders.map(item => ({
    DCNum: item.DCNum,
    Time1: item.Time1,
    Vehicle: item.Vehicle,
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
      ) : boulders.length === 0 ? (
        <div className="text-center p-4 border rounded bg-light">
          <p className="m-0 text-muted">🪨 No boulder data available</p>
        </div>
      ) : (
        <DashboardList2
          title="Today Boulders"
          periodOptions={periodOptions}
          tableHeaders={tableHeaders}
          dealsData={formattedDeals}
          columnTypes={columnTypes}
        />
      )}
    </>
  );
};

export default TodayBoulders;

