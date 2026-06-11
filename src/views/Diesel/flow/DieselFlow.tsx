import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import DieselFlowSearch from "./DieselFlowSearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// Interface based on actual API response
interface DieselFlowItem {
    Date: string;
    Stock: string;
    Issed: string;
    Balance: number;
}

// API response type
type SummaryResponse = DieselFlowItem[];

// Filters for the search
interface Filters {
    FromDate: string;
    ToDate: string;
}

const DieselFlow = () => {
    const [materialTop, setMaterialTop] = useState<DieselFlowItem[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });

    const accessDenied = checkPageAccess("Diesel", "Flow");

    // Table headers matching the API fields
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date" },
        { label: "Stock", key: "Stock", dataType: "number" },
        { label: "Issued", key: "Issed", dataType: "number" },
        { label: "Balance", key: "Balance", dataType: "number", showTotal: false },
    ];

    useEffect(() => {
        if (accessDenied) return;
        apiGet();
    }, [filters, accessDenied]);

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
            const res = await axios.post<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselStock`,
                {
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate,
                }
            );
            setMaterialTop(res.data || []);
        } catch (err) {
            console.error("Error fetching diesel flow data:", err);
        }
        finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (formData: Filters) => {
        setFilters(formData);
        setShowSearch(false);
    };

    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    if (accessDenied) return accessDenied;

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
                    <ListComponent appliedFilters={filters}
                        title="Diesel Flow Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        onSuccess={apiGet}
                        handleShow={() => setShowSearch(true)}
                    />
                )}
                <DieselFlowSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </div>
        </div>
    );
};

export default DieselFlow;

