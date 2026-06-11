import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface InventoryBalanceItem {
    Spares: string;
    Stock: string;
    Issued: string | null;
    Balance: number;
}

type SummaryResponse = InventoryBalanceItem[];

const BalanceList = () => {
    const accessDenied = checkPageAccess("Inventory", "Balance");
    if (accessDenied) return accessDenied;

    const [materialTop, setMaterialTop] = useState<InventoryBalanceItem[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Spares", key: "Spares" },
        { label: "Stock", key: "Stock" },
        { label: "Issued", key: "Issued" },
        { label: "Balance", key: "Balance" },
    ];

    useEffect(() => {
        apiGet();
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

    const apiGet = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=InventoryBalance`
            );
            setMaterialTop(res.data || []);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
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
                    <ListComponent
                        title="Inventory Balance Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                    />
                )}
            </div>
        </div>
    );
};

export default BalanceList;

