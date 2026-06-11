import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import DieselReportSearch from "./DieselReportSearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface DieselReportItem {
    Date: string;
    Vehicle: string;
    Stock: string;
    Issed: string;
    Balance: number;
}

type SummaryResponse = DieselReportItem[];

const DieselReports = () => {
    const accessDenied = checkPageAccess("Diesel", "Reports");
    if (accessDenied) return accessDenied;

    const [materialTop, setMaterialTop] = useState<DieselReportItem[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date" },
        { label: "Vehicle", key: "Vehicle" },
        { label: "Stock", key: "Stock", dataType: "number" },
        { label: "Issued", key: "Issed", dataType: "number" },
        { label: "Balance", key: "Balance", dataType: "number", showTotal: false },
    ];

    useEffect(() => {
        apiGet();
    }, [filters]);
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
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=DieselReport`,
                {
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate
                }
            );
            setMaterialTop(res.data || []);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };
    const handleSearchSubmit = (formData: typeof filters) => {
        setFilters(formData);
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
                        title="Diesel Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        handleShow={() => setShowSearch(true)}
                    />
                )}
                <DieselReportSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </div>
        </div>
    );
};

export default DieselReports;

