import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import ContractorSearch from "./contractorSearch";
import { Key } from "react-bootstrap-icons";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DashboardListRow {
  [key: string]: string | number;
}

interface DebitorDeal extends DashboardListRow {
  ID: number;
  Date: string;
  Description: string;
  Credits: number;
  Debits: number;
  Balance: number;
}
interface Ledger {
  ID: string;
  Party: string;
  Type: string;
  Status: string;
}

interface Filters {
  FromDate: string;
  ToDate: string;
  Contractor: string;
}

const ContractorStatement = () => {
  const accessDenied = checkPageAccess("Quarry", "Contractor");
  if (accessDenied) return accessDenied;

  const [data, setData] = useState<DebitorDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [contractors, setContractors] = useState<Ledger[]>([]);
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems");
        if (!id) return;

        const res = await fetch(
          `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
        );

        const data = await res.json();

        // ✅ STRICT FILTER → ONLY CONTRACTORS
        const contractorOnly = (Array.isArray(data) ? data : []).filter(
          (item: Ledger) =>
            item.Type === "Contractor" && item.Status === "Active"
        );

        setContractors(contractorOnly);
      } catch (err) {
        console.error("Failed to fetch contractors", err);
      }
    };

    fetchContractors();
  }, []);

  const [filters, setFilters] = useState<Filters>({
    FromDate: "",
    ToDate: "",
    Contractor: "",
  });

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Description", key: "Description", dataType: "string" },
    { label: "Net", key: "Nett", dataType: "number" },
    { label: "Payable", key: "Total", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  const apiGet = useCallback(async (payload: Filters) => {
    try {
      setLoading(true);
      const id = sessionStorage.getItem("selectedItems") ?? "";

      const res = await axios.post<DebitorDeal[]>(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=ContractorStatement`,
        payload
      );

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("API Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiGet(filters);
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
  // Handle filter 

  const handleSearchSubmit = (formData: Filters) => {
    setFilters(formData);
    apiGet(formData); // 🔥 call API only on submit
    setShowSearch(false);
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
          <ListComponent
            title="Contractor Statement"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={data}
            loading={loading}
            handleShow={() => setShowSearch(true)}
          />
        )}

        <ContractorSearch
          show={showSearch}
          handleClose={() => setShowSearch(false)}
          handleSubmit={handleSearchSubmit}
        />
      </div>
    </div>
  );
};

export default ContractorStatement;

