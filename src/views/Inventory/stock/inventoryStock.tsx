import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ListComponent from "../../../components/reuse-components/listComponent";
import InventryStockModal from "./inventorySearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
// Define interface for row
interface SpareStock {
    Date1: string;
    Names: string;
    Spares: string;
    Particular: string;
    Qty: string;
    Rate: string;
    Amount: string;
}

type SpareStockResponse = SpareStock[];

const SpareStockList = () => {
    const [spareData, setSpareData] = useState<SpareStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [filters, setFilters] = useState({
        Payee: "",
        Spares: "",
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });

    const accessDenied = checkPageAccess("Inventory", "Stock");

    // Define table headers
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1" },
        { label: "Party Name", key: "Names" },
        { label: "Spares", key: "Spares" },
        { label: "Particular", key: "Particular" },
        { label: "Qty", key: "Qty", dataType: "number" },
        { label: "Rate", key: "Rate", dataType: "number" },
        { label: "Amount", key: "Amount", dataType: "number" },
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
            const res = await axios.post<SpareStockResponse>(
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryStock`,
                {
                    Payee: filters.Payee,
                    Spares: filters.Spares,
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate,
                }
            );
            console.log(res.data)
            setSpareData(res.data || []);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        }
        finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (formData: typeof filters) => {
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
                    <ListComponent
                        title="Spare Stock Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={spareData}
                        onSuccess={apiGet}
                        handleShow={() => setShowSearch(true)} // ✅ open search modal
                    />
                )}
                <InventryStockModal
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </div>
        </div>
    );
};

export default SpareStockList;

