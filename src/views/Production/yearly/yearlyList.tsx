import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface MaterialRecord {
  Date1: string;
  Material: string;
  Nett: string;
}

interface PivotRow {
  Material: string;
  [date: string]: string | number;
}

const YearlyList = () => {
  const accessDenied = checkPageAccess("Production", "Yearly");
  if (accessDenied) return accessDenied;

  const [pivotData, setPivotData] = useState<PivotRow[]>([]);
  const [headers, setHeaders] = useState<{ label: string; key: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      const res = await axios.get<MaterialRecord[]>(
        `https://norisapi.noris.in/Crusher/Production.php?ID=${id}&TableName=YearlyMaterial`
      );

      const rawData = res.data || [];
      const { pivotRows, tableHeaders } = transformToPivot(rawData);

      setPivotData(pivotRows);
      setHeaders(tableHeaders);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const transformToPivot = (data: MaterialRecord[]) => {
    const dateSet = new Set<string>();
    const materialMap: Record<string, Record<string, number>> = {};

    data.forEach((item) => {
      const date = item.Date1;
      const material = item.Material;
      const nett = Number(item.Nett.replace(/,/g, "")) || 0;

      dateSet.add(date);

      if (!materialMap[material]) materialMap[material] = {};
      if (!materialMap[material][date]) materialMap[material][date] = 0;

      materialMap[material][date] += nett;
    });

    const toTime = (d: string) => {
      const [dd, mm, yyyy] = d.split("-").map(Number);
      return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
    };

    const dates = Array.from(dateSet).sort((a, b) => toTime(a) - toTime(b));

    const pivotRows: PivotRow[] = [];

    Object.entries(materialMap).forEach(([material, dateValues]) => {
      const row: PivotRow = { Material: material };

      dates.forEach((date) => {
        const val = dateValues[date] ?? 0;

        row[date] = new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
      });

      pivotRows.push(row);
    });

    const totalRow: PivotRow = { Material: "Grand Total" };

    dates.forEach((date) => {
      let colSum = 0;

      pivotRows.forEach((row) => {
        colSum += Number(String(row[date]).replace(/,/g, "")) || 0;
      });

      totalRow[date] = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(colSum);
    });

    pivotRows.push(totalRow);

    const tableHeaders = [
      { label: "Material", key: "Material" },
      ...dates.map((d) => ({ label: d, key: d })),
    ];

    return { pivotRows, tableHeaders };
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
            title="Yearly Material Pivot Summary"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={pivotData}
          />
        )}

      </div>
    </div>
  );
};

export default YearlyList;

