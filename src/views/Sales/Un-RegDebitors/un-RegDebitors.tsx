import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DailyDeal {
  Date1: string;
  Boulders: string;
  Yard: string;
  TotalSales: string;
  YardSales: string;
  Balance: string;
}

type SummaryResponse = DailyDeal[];

const SaleUnRegDebitors = () => {
  const accessDenied = checkPageAccess("Sales", "Reg Debitors");
  if (accessDenied) return accessDenied;

  const [materialTop, setMaterialTop] = useState<DailyDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date1" },
    { label: "Boulders", key: "Boulders", dataType: "number" },
    { label: "Yard", key: "Yard", dataType: "number" },
    { label: "Total Sales", key: "TotalSales", dataType: "number" },
    { label: "Yard Sales", key: "YardSales", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];
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
  useEffect(() => {
    apiGet();
  }, []);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  useEffect(() => {
    const companyData = sessionStorage.getItem("selectedItems1");
    if (companyData) {
      setSelectedCompany(JSON.parse(companyData));
    }
  }, []);

  const apiGet = async () => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get<SummaryResponse>(
        `https://norisapi.noris.in/Crusher/Production.php?ID=${id}&TableName=ProductionDaily`
      );
      setMaterialTop(res.data || []);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };
  const exportPdf = () => {
    if (!selectedCompany || !materialTop.length) return;

    const doc = new jsPDF("landscape"); // better for wide table
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - margin * 2;

    // ===== Company Header =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(selectedCompany.Name || "", pageWidth / 2, 10, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const addressLines = doc.splitTextToSize(
      selectedCompany.State1 || "",
      maxWidth
    );

    doc.text(addressLines, pageWidth / 2, 16, { align: "center" });

    doc.text(
      `Phone: ${selectedCompany.Contact || ""}`,
      pageWidth / 2,
      22,
      { align: "center" }
    );

    doc.text(
      `GSTIN: ${selectedCompany.GST || ""} | IMIE: ${selectedCompany.IMIE || ""}`,
      pageWidth / 2,
      27,
      { align: "center" }
    );

    doc.line(margin, 32, pageWidth - margin, 32);

    // ===== Report Title =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Quarry Report", pageWidth / 2, 40, {
      align: "center",
    });

    // ===== Table =====
    autoTable(doc, {
      startY: 45,
      head: [[
        "S.No",
        "Date",
        "Boulders",
        "Yard",
        "Total Sales",
        "Yard Sales",
        "Balance",
      ]],
      body: materialTop.map((row, index) => [
        index + 1,
        row.Date1,
        row.Boulders,
        row.Yard,
        row.TotalSales,
        row.YardSales,
        row.Balance,
      ]),
      styles: {
        halign: "right",
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
      },
    });

    doc.save("Daily-Quarry-Report.pdf");
  };
  const exportExcel = () => {
    if (!materialTop.length) return;

    const data = materialTop.map((row, index) => ({
      "S.No": index + 1,
      Date: row.Date1,
      Boulders: row.Boulders,
      Yard: row.Yard,
      "Total Sales": row.TotalSales,
      "Yard Sales": row.YardSales,
      Balance: row.Balance,
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Quarry Report");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      "Daily-Quarry-Report.xlsx"
    );
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

              {/* Static Logo */}
              <img
                src={logo}
                alt="Loading"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 50,
                  height: 50,
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

export default SaleUnRegDebitors;

