import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import axios from "axios";
import { useEffect, useState } from "react";

interface MaterialData {
  Material: string;
  Nett: string | number;
}

const FinanicalPieChart = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Apiget();
  }, []);

  const Apiget = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get<MaterialData[]>(
        `https://norisapi.noris.in/Crusher/FinanaceDashBoard.php?ID=${id}&Table=MaterialNett`
      );
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const materials = res.data.map((item) => item.Material);
        const netValues = res.data.map((item) => Number(item.Nett) || 0);
        setLabels(materials);
        setSeries(netValues);
      } else {
        setLabels([]);
        setSeries([]);
      }
    } catch (error) {
      console.error("API error:", error);
      setLabels([]);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const dynamicColors = [
    "#2F80ED", "#27AE60", "#FFA201", "#E41F07", "#9B51E0",
    "#56CCF2", "#F2994A", "#6FCF97", "#BB6BD9", "#219653",
    "#EB5757", "#F2C94C", "#2D9CDB", "#BDBDBD", "#333333",
  ].slice(0, labels.length);

  const options: ApexOptions = {
    chart: { type: "pie", height: 430 },
    colors: dynamicColors,
    labels,
    legend: { position: "bottom" },
    dataLabels: {
      enabled: true,
      formatter: (_val: number, opts) => {
        const value = series[opts.seriesIndex];
        return value !== undefined ? value.toFixed(2) : "";
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(2)}`,
      },
    },
  };

  if (loading) {
    return (
      <div
        style={{
          height: 430,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center p-4 border rounded bg-light">
        <p className="m-0 text-muted">📊 No data available</p>
      </div>
    );
  }

  return <Chart options={options} series={series} type="pie" height={430} />;
};

export default FinanicalPieChart;

