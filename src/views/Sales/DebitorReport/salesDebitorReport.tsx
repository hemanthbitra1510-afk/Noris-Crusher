import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import SalesDebitorReportSearch from "./salesDebitorReportSearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DebitorEntry {
    DCNum: string;
    Date: string;
    Time: string;
    Vehicle: string;
    Material: string;
    Destination: string;
    Nett: string;
    Rate: string;
    Amount: string;
    Transport: string;
    Discount: string;
    Total: string;
    Paid: string;
    Balance: number;
}

interface Filters {
    FromDate: string;
    ToDate: string;
    Party: string;
}

const DebitorBalanceReport = () => {
    const accessDenied = checkPageAccess("Sales", "Debitor Report");
    if (accessDenied) return accessDenied;


    const [debitorData, setDebitorData] = useState<DebitorEntry[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<{ Party?: string; FromDate?: string; ToDate?: string } | null>(null);
    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Party: "",
    });

    // 👉 Table headers
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "DC No", key: "DCNum", dataType: "string" },
        { label: "Date", key: "Date", dataType: "string" },
        { label: "Time", key: "Time", dataType: "string" },
        { label: "Vehicle", key: "Vehicle", dataType: "string" },
        { label: "Material", key: "Material", dataType: "string" },
        { label: "Destination", key: "Destination", dataType: "string" },

        // Numeric columns
        { label: "Nett", key: "Nett", dataType: "number" },
        { label: "Rate", key: "Rate", dataType: "number" },
        { label: "Amount", key: "Amount", dataType: "number" },
        { label: "Transport", key: "Transport", dataType: "number" },
        { label: "Discount", key: "Discount", dataType: "number" },
        { label: "Total", key: "Total", dataType: "number" },
        { label: "Paid", key: "Paid", dataType: "number" },
        { label: "Balance", key: "Balance", dataType: "number" },
    ];


    const handleSearchSubmit = (formData: Filters) => {
        setAppliedFilters(formData);   // ✅ ADD THIS LINE
        setFilters(formData);
        setShowSearch(false);
    };
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
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const response = await axios.post<DebitorEntry[]>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=DebitorStatement`,
                filters
            );

            const rawData = Array.isArray(response.data)
                ? response.data
                : [response.data];

            const updatedData = rawData.map((entry) => {
                const nett = parseFloat(entry.Nett) || 0;

                return {
                    ...entry,
                    Nett: Number(nett.toFixed(2)),
                };
            });

            setDebitorData(updatedData);

        } catch (error) {
            console.error("Error fetching debitor data:", error);
        } finally {
            setLoading(false);
        }
    };

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
                        title="Debitor Statement"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={debitorData}
                        handleShow={() => setShowSearch(true)}
                    />
                )}
                <SalesDebitorReportSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleSubmit={handleSearchSubmit}
                />

            </div>
        </div>
    );
};

export default DebitorBalanceReport;

