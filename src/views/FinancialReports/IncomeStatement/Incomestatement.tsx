import { checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import { Offcanvas } from "react-bootstrap";

interface IncomeRow {
  Month: string;
  Receipts: string;
  Payments: string;
  Balance: number;
}

const IncomeStatement = () => {
  const [data, setData] = useState<IncomeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasData, setCanvasData] = useState<any[]>([]);
  const [canvasTitle, setCanvasTitle] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  const accessDenied = checkPageAccess("Reports", "Income");
  const showToast = useToast();

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Month", key: "Month" },
    { label: "Receipts", key: "Receipts", dataType: "number" },
    { label: "Payments", key: "Payments", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number", showTotal: false },
  ];

  useEffect(() => {
    if (accessDenied) return;
    apiGet();
  }, [accessDenied]);

  const apiGet = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Reports.php?ID=${id}&TableName=Income`
      );

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setData([]);
      showToast("Error", "Failed to load data", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Month → Date Range
  const getMonthDateRange = (monthStr: string) => {
    const [mon, year] = monthStr.split("-");
    const monthIndex = new Date(`${mon} 1, ${year}`).getMonth();

    const fromDate = `01-${String(monthIndex + 1).padStart(2, "0")}-${year}`;
    const lastDay = new Date(Number(year), monthIndex + 1, 0).getDate();
    const toDate = `${String(lastDay).padStart(2, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${year}`;

    return { fromDate, toDate };
  };

  // 🔥 CLICK HANDLER
  const handleCellClick = async (row: IncomeRow, key: string) => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      if (!id) return;

      let tableName = "";
      let payload: any = {};

      const { fromDate, toDate } = getMonthDateRange(row.Month);

      if (key === "Receipts") {
        tableName = "Receipts";
        payload = { FromDate: fromDate, ToDate: toDate };
      } else if (key === "Payments") {
        tableName = "Payments";
        payload = { FromDate: fromDate, ToDate: toDate };
      } else {
        tableName = "DailyStatement";
        payload = { FromDate: row.Month };
      }

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Reports.php?ID=${id}&TableName=${tableName}`,
        payload
      );

      setCanvasData(Array.isArray(res.data) ? res.data : []);
      setCanvasTitle(`${key} - ${row.Month}`);
      setSelectedColumn(key);
      setShowCanvas(true);

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 EVENT DELEGATION (THIS FIXES YOUR CLICK ISSUE)
  useEffect(() => {
    const container = tableRef.current;
    if (!container) return;

    const handleClick = (e: any) => {
      const td = e.target.closest("td");
      if (!td) return;

      const tr = td.parentElement;
      const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
      const colIndex = Array.from(tr.children).indexOf(td);

      const rowData = data[rowIndex];
      const key = headers[colIndex]?.key;

      if (!rowData || !key) return;

      if (!["Month", "Receipts", "Payments", "Balance"].includes(key)) return;

      handleCellClick(rowData, key);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [data]);

  if (accessDenied) return accessDenied;

  return (
    <div className="page-wrapper">
      <div className="content p-2">

        {loading ? (
          <div className="text-center p-5">Loading...</div>
        ) : (
          <div ref={tableRef}>
            <ListComponent
              title="Income Statement"
              periodOptions={["All", "This Month", "Last Month", "This Year"]}
              tableHeaders={headers as any}
              dealsData={data}
              mainModule="Reports"
              subModule="Income"
              loading={loading}
              onSuccess={apiGet}
            />
          </div>
        )}

        {/* OFFCANVAS */}
        <Offcanvas show={showCanvas} onHide={() => setShowCanvas(false)} placement="end">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{canvasTitle}</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            {canvasData.length === 0 ? (
              <p>No data found</p>
            ) : (
              <table className="table table-bordered">
                <thead>
                  <tr>
                    {Object.keys(canvasData[0]).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {canvasData.map((r, i) => (
                    <tr key={i}>
                      {Object.keys(r).map((col, idx) => (
                        <td key={idx}>
                          {col.toLowerCase().includes("date")
                            ? r[col]
                            : `₹ ${Number(r[col] || 0).toLocaleString("en-IN")}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Offcanvas.Body>
        </Offcanvas>

      </div>
    </div>
  );
};

export default IncomeStatement;