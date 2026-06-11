import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import OtherSalesSearch from "./otherSalesSearch";
import SalesForm from "../salesFrom";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface SalesEntry {
  DCNum: string;
  Date: string;
  Time: string;
  Vehicle: string;
  Party: string;
  Material: string;
  Destination: string;
  Gross: string | number;
  Tare: string | number;
  Nett: string | number;
  Rate: string | number;
  Amount: string | number;
  Discount: string | number;
  Total: string | number;
}

interface Filters {
  FromDate: string;
  ToDate: string;
  Party: string;
}

const OtherSales = () => {
  const id = sessionStorage.getItem("selectedItems") ?? "";
  const whitelist = ["IMIE02062022", "IMIE08042023", "IMIE14072023"];
  const showToast = useToast();

  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fromData, setFromData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Party: "",
  });

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "DC No", key: "DCNum", dataType: "string" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Time", key: "Time", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Party", key: "Party", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Source", key: "Source", dataType: "string" },
    { label: "Destination", key: "Destination", dataType: "string" },
    { label: "Gross", key: "Gross", dataType: "number" },
    { label: "Tare", key: "Tare", dataType: "number" },
    { label: "Nett", key: "Nett", dataType: "number" },
    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Discount", key: "Discount", dataType: "number" },
    { label: "Total", key: "Total", dataType: "number" }
  ];

  const handleSearchSubmit = (formData: Filters) => {
    setAppliedFilters(formData);
    setFilters(formData);
    setShowSearch(false);
  };

  const handleAdd = () => {
    setFromData(null);
    setShowForm(true);
  };

  const handleEdit = (deal: any) => {
    setFromData(deal);
    setShowForm(true);
  };

  const handleSubmit = async (payload: any) => {
    try {
      const activeId = sessionStorage.getItem("selectedItems") ?? "";
      if (!activeId) return;

      const isEdit = !!payload.ID;

      console.log("[OtherSales] form payload received:", payload);
      console.log("[OtherSales] payload.Destination =", payload.Destination);

      let formattedDate = payload.Date || "";
      if (formattedDate && formattedDate.includes("-") && formattedDate.split("-")[0].length === 4) {
        const [y, m, d] = formattedDate.split("-");
        formattedDate = `${d}-${m}-${y}`;
      }

      const requestBody: any = {
        Party: payload.Party || "",
        Material: payload.Material || "",
        Vehicle: payload.Vehicle || "",
        Source: payload.Source || "",
        Destination: payload.Destination || "",
        Driver: payload.Driver || "",
        Transporter: payload.Transporter || "",
        Gross: payload.Gross || 0,
        Tare: payload.Tare || 0,
        Nett: payload.Nett || 0,
        Rate: payload.Rate || 0,
        Amount: payload.Amount || 0,
        Transport: payload.Transport || 0,
        Less: payload.Less || 0,
        Stationary: payload.Stationary || "",
        Payment: payload.Payment || "",
        DCNum: payload.DCNum || "",
        Date1: formattedDate, // PHP script expects Date1 for the Date field
      };

      if (isEdit) {
        requestBody.ids = payload.ID;
        requestBody.IDS = payload.ID;
      }

      console.log("[OtherSales] requestBody being POSTed:", requestBody);

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${activeId}&TableName=UpdateOtherWeighmentRecord`,
        requestBody
      );

      if (res.data?.status === "Success") {
        showToast("Success", res.data?.message || `Record ${isEdit ? "updated" : "added"} successfully`, "success");
        setShowForm(false);
        apiGet(); // refresh
      } else {
        showToast("Error", res.data?.message || "Operation failed", "danger");
      }
    } catch (err) {
      console.error("Error saving record:", err);
      showToast("Error", "Server error occurred", "danger");
    }
  };

  useEffect(() => {
    if (!whitelist.includes(id)) {
      setLoading(false);
      return;
    }

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    const loadData = async () => {
      setLoading(true);
      try {
        await apiGet();
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      document.head.removeChild(style);
    };
  }, [filters, id]);

  const apiGet = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=OtherSales`,
        filters
      );

      const rawData = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean);
      const updatedData = rawData.map((entry: any) => {
        const nett = parseFloat(entry.Nett) || parseFloat(entry.Net) || 0;
        return {
          ...entry,
          Date: entry.Date || entry.Date1 || "",
          Time: entry.Time || entry.Time1 || "",
          Amount: entry.Amount || entry.ReceiptAmount || entry.Total || 0,
          Nett: nett
        };
      });

      setSalesData(updatedData);
    } catch (err: unknown) {
      console.error("Error fetching other sales data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!whitelist.includes(id)) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center p-5 shadow-sm rounded bg-white" style={{ maxWidth: "450px" }}>
          <i className="ti ti-lock text-danger" style={{ fontSize: "4.5rem" }}></i>
          <h3 className="mt-3 fw-bold text-dark">Access Denied</h3>
          <p className="text-muted mt-2">
            The active Company ID (<code>{id || "None"}</code>) is not authorized to access the Other Sales submodule.
          </p>
        </div>
      </div>
    );
  }

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  return (
    <div className="page-wrapper">
      <div className="content p-2">
        {appliedFilters && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "10px 15px",
              borderRadius: "6px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <strong>Applied Filters:</strong>
            <div style={{ marginTop: "5px" }}>
              {appliedFilters.Party && <span className="me-3">Party: {appliedFilters.Party}</span>}
              {appliedFilters.FromDate && <span className="me-3">From: {appliedFilters.FromDate}</span>}
              {appliedFilters.ToDate && <span className="me-3">To: {appliedFilters.ToDate}</span>}
            </div>
          </div>
        )}

        {loading ? (
          <div
            style={{
              height: "350px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                border: "6px solid #f3f3f3",
                borderTop: "6px solid #0d6efd",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
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
        ) : (
          <ProductionList
            title="Other Sales"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={salesData}
            handleEdit={handleEdit}
            onAddClick={handleAdd}
            addClickText="Add Other Sales"
            handleShow={() => setShowSearch(true)}
          />
        )}

        <OtherSalesSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleSubmit={handleSearchSubmit}
        />

        <SalesForm
          show={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => {
            handleSubmit(data);
          }}
          initialData={fromData}
          showDCField={true}
          showSourceField={true}
        />
      </div>
    </div>
  );
};

export default OtherSales;
