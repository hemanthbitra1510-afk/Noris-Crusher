import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import Select from "react-select";
import { Button } from "react-bootstrap";
import ProductionList from "../../../components/reuse-components/productionList";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface TransporterOption {
  value: string;
  label: string;
}

interface StatementRow {
  Date?: string;
  DCNum?: string;
  Vehicle?: string;
  Material?: string;
  Destination?: string;
  Rate?: string;
  Nett?: string;
  Amount?: string;
  Paid?: string;
  Balance?: string | number;
}

interface Filters {
  FromDate: string;
  ToDate: string;
  Party: string;
}

const TransporterStatement = () => {
  const accessDenied = checkPageAccess("Transporter", "Transport");
  if (accessDenied) return accessDenied;


  const [statementData, setStatementData] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Party: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
    ToDate: moment().format("YYYY-MM-DD"),
    Party: "",
  });

  const [transporterOptions, setTransporterOptions] =
    useState<TransporterOption[]>([]);

  const periodOptions = ["All", "This Month", "Last Month", "This Year"];

  /* ================= FETCH TRANSPORTERS ================= */

  useEffect(() => {

    const fetchTransporters = async () => {

      try {

        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await axios.get(
          `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
        );

        const transporters = (res.data || [])
          .map((item: any) => ({
            value: item.Party,
            label: item.Party,
          }));

        setTransporterOptions(transporters);

      } catch (error) {

        console.error("Transport fetch error:", error);

      }

    };

    fetchTransporters();

  }, []);

  /* ================= FETCH STATEMENT ================= */

  const fetchStatement = async (customFilters?: Filters) => {

    try {

      setLoading(true);

      const id = sessionStorage.getItem("selectedItems") ?? "";
      const activeFilters = customFilters || appliedFilters;

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Transporter.php?ID=${id}&TableName=TransporterStatement`,
        activeFilters
      );

      setStatementData(Array.isArray(res.data) ? res.data : []);

    } catch (error) {

      console.error("Statement fetch error:", error);
      setStatementData([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchStatement();
  }, []);

  /* ================= APPLY FILTER ================= */

  const handleApplyFilters = () => {

    setAppliedFilters(filters);
    fetchStatement(filters);

  };

  /* ================= TABLE HEADERS ================= */

  const headers = [
    { label: "S.No", key: "sno", dataType: "index" },
    { label: "Date", key: "Date", dataType: "string" },
    { label: "DC No", key: "DCNum", dataType: "string" },
    { label: "Vehicle", key: "Vehicle", dataType: "string" },
    { label: "Material", key: "Material", dataType: "string" },
    { label: "Destination", key: "Destination", dataType: "string" },
    { label: "Rate", key: "Rate", dataType: "number" },
    { label: "Nett", key: "Nett", dataType: "number" },
    { label: "Amount", key: "Amount", dataType: "number" },
    { label: "Paid", key: "Paid", dataType: "number" },
    { label: "Balance", key: "Balance", dataType: "number" },
  ];

  /* ================= FILTER UI ================= */



  const filterUI = (
    <div className="row g-3">

      <div className="col-md-3">
        <label className="form-label">From Date</label>
        <input
          type="date"
          className="form-control"
          value={filters.FromDate}
          onChange={(e) =>
            setFilters({ ...filters, FromDate: e.target.value })
          }
        />
      </div>

      <div className="col-md-3">
        <label className="form-label">To Date</label>
        <input
          type="date"
          className="form-control"
          value={filters.ToDate}
          onChange={(e) =>
            setFilters({ ...filters, ToDate: e.target.value })
          }
        />
      </div>

      <div className="col-md-4">
        <label className="form-label">Transporter</label>
        <Select
          options={transporterOptions}
          isSearchable
          isClearable
          onChange={(selected) =>
            setFilters({
              ...filters,
              Party: selected?.value || "",
            })
          }
        />
      </div>

      <div className="col-md-2 d-flex align-items-end">
        <button
          className="btn btn-primary w-100"
          onClick={handleApplyFilters}
        >
          Apply
        </button>
      </div>

    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="content p-2">

        {(appliedFilters.FromDate ||
          appliedFilters.ToDate ||
          appliedFilters.Party) && (
            <div className="alert alert-info py-2">
              <strong>Applied Filters:</strong>{" "}
              {appliedFilters.FromDate && `From: ${appliedFilters.FromDate} `}
              {appliedFilters.ToDate && `| To: ${appliedFilters.ToDate} `}
              {appliedFilters.Party &&
                `| Transporter: ${appliedFilters.Party}`}
            </div>
          )}

        {loading ? (
          <div
            style={{
              height: "350px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: 150, height: 150 }}>

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
            title="Transporter Statement"
            periodOptions={periodOptions}
            tableHeaders={headers}
            dealsData={statementData}
            appliedFilters={appliedFilters}
            customFilter={filterUI}
          />

        )}

      </div>
    </div>
  );
};

export default TransporterStatement;

