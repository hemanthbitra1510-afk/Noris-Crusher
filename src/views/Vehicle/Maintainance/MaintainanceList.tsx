import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import MaintainaceSearch from "./MaintainaceSearch";
import ProductionList from "../../../components/reuse-components/productionList";
import MaintainaceReport from "./MaintainaceReport";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface MaintenanceItem {
    Vehicle: string;
    DieselLitres: number | null;
    DieselAmount: number | null;
    Purchase: number | null;
    Stock: number | null;
    Total?: number;
}

type SummaryResponse = MaintenanceItem[];

const MaintainanceList = () => {
    const accessDenied = checkPageAccess("Vehicle", "Maintainance");
    if (accessDenied) return accessDenied;

    const [maintenanceList, setMaintenanceList] = useState<MaintenanceItem[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
    const [dealsdata, setDealsData] = useState(false); // ✅ state for summary
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Vehicle", key: "Vehicle", dataType: "string" },
        { label: "Diesel Litres", key: "DieselLitres", dataType: "number" },
        { label: "Diesel Amount", key: "DieselAmount", dataType: "number" },
        { label: "Purchase", key: "Purchase", dataType: "number" },
        { label: "Stock", key: "Stock", dataType: "number" },
        { label: "Total", key: "Total", dataType: "number" },
    ];
    interface Filters {
        FromDate: string;
        ToDate: string;
    }

    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });
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
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=VehicleMaintainance`, {
                FromDate: filters.FromDate,
                ToDate: filters.ToDate,
            }
            );
            const dataWithTotals = (res.data || []).map(item => ({
                ...item,
                StockAmount: item.Stock,
                Total: Number(item.DieselAmount || 0) + Number(item.Purchase || 0) + Number(item.Stock || 0)
            }));
            setMaintenanceList(dataWithTotals);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
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
    const handleLine = (deal: any) => {
        setShowSummary(true)
        setDealsData(deal)
    }
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
                    <ProductionList appliedFilters={filters}
                        title="Vehicle Maintenance"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={maintenanceList}
                        handleLine={handleLine}
                        handleShow={() => setShowSearch(true)}
                    />)}
                <MaintainaceSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
                <MaintainaceReport
                    show={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={dealsdata}
                    parentFilters={filters}
                />
            </div>
        </div>
    );
};

export default MaintainanceList;
