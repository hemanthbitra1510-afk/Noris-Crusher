import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import SalesDebitorSummarySearch from "./saleDebitorSummarsearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// Interface matching your API JSON
interface DebitorSummaryEntry {
    Party: string;
    Opening: number | string;
    Tonnes: string;
    Credit: string;
    Paid: string | null;
    Closing: number | string;
}

interface Filters {
    FromDate: string;
    ToDate: string;
    Party: string;
}

type DebitorSummaryResponse = DebitorSummaryEntry[];

const SaleDebitorSummary = () => {
    const accessDenied = checkPageAccess("Sales", "Debitor Summary");
    if (accessDenied) return accessDenied;

    const [materialTop, setMaterialTop] = useState<DebitorSummaryEntry[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Party: "",
    });

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Party", key: "Party" },
        { label: "Opening Balance", key: "Opening", dataType: "number" },
        { label: "Tonnes", key: "Tonnes", dataType: "string" },
        { label: "Credit Amount", key: "Credit", dataType: "number" },
        { label: "Paid Amount", key: "Paid", dataType: "number" },
        { label: "Closing Balance", key: "Closing", dataType: "number" },
    ];

    const handleSearchSubmit = (formData: Filters) => {
        setAppliedFilters(formData);
        setFilters(formData);
        setShowSearch(false);
    };

    useEffect(() => {
        // ✅ ADD animation keyframes here
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
    }, [filters]);

    const apiGet = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.post<DebitorSummaryResponse>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=DebitorSummary`,
                filters
            );

            setMaterialTop(Array.isArray(res.data) ? res.data : [res.data]);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        }
        finally {
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
                            {appliedFilters.Material && <span className="me-3">Material: {appliedFilters.Material}</span>}
                            {appliedFilters.Vehicle && <span className="me-3">Vehicle: {appliedFilters.Vehicle}</span>}
                            {appliedFilters.Driver && <span className="me-3">Driver: {appliedFilters.Driver}</span>}
                            {appliedFilters.Transporter && <span className="me-3">Transporter: {appliedFilters.Transporter}</span>}
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
                        title="Debitor Summary"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        handleShow={() => setShowSearch(true)}
                    />
                )}
                <SalesDebitorSummarySearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </div>
        </div>
    );
};

export default SaleDebitorSummary;

