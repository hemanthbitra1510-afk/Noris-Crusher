import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardBody, CardHeader } from "react-bootstrap";

interface DebitorDeal {
  Date: string;
  BNett: string; // API returns string with commas
  SNett: string;
}

type SummaryResponse = DebitorDeal[];

const DealsReportChart = () => {
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
        `https://norisapi.noris.in/Crusher/MaterialDashBoard.php?ID=${id}&Table=Production5`
      );

      setDebitor(res.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDebitor([]);
    } finally {
      setTimeout(() => {
        setLoading(false); // ✅ STOP LOADING (smooth)
      }, 300);
    }
  };

  // Prepare chart data
  const categories = debitor.map((item) => item.Date);
  const wonDeals = debitor.map((item) =>
    parseFloat(item.BNett.replace(/,/g, ""))
  );
  const lostDeals = debitor.map((item) =>
    parseFloat(item.SNett.replace(/,/g, ""))
  );

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: "100%", // allow flex/parent control
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "55%" },
    },
    colors: ["#5CB85C", "#FC0027"],
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      labels: { rotate: -45 }, // avoid overlap on small screens
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString() + " Deals",
      },
    },
    responsive: [
      {
        breakpoint: 992, // tablets
        options: {
          plotOptions: { bar: { columnWidth: "65%" } },
          legend: { position: "bottom" },
          chart: { height: 350 },
        },
      },
      {
        breakpoint: 576,
        options: {
          plotOptions: { bar: { horizontal: true } }, // switch to horizontal for readability
          chart: { height: 400 },
          xaxis: { labels: { rotate: 0 } },
        },
      },
    ],
  };

  const series = [
    { name: "Boulders", data: wonDeals },
    { name: "Sales", data: lostDeals },
  ];

  return (
    <Card>
      <CardHeader className="bg-primary bg-opacity-10">
        <h5 className="font-semibold text-primary">
          Last 5 days Production Vs Sale
        </h5>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div
            style={{
              height: 360,
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
            <p className="m-0 text-muted">
              📊 No production vs sales data available
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <Chart
              options={options}
              series={series}
              type="bar"
              height={360}
              width="100%"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
export default DealsReportChart;

