import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import SalesStatementSearch from "./saleStatementSearch";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface SalesStatementEntry {
    DCNum: string;
    Vehicle: string;
    Material: string;
    Party: string;
    Destination: string;
    Nett: string;
    Rate: string;
    Date1: string;
    Time1: string;
    Payment: string;
    TotalAmount: string;
    Discount: string;
    TransporterAmount: string;
    Less: string; // ✅ ADD
    ReceiptAmount: string;
    Transporter: string;
}


type SalesStatementResponse = SalesStatementEntry[];

interface Filters {
    FromDate: string;
    ToDate: string;
    Material: string;
    Party: string;
    Vehicle: string;
    Driver: string;
    Transporter: string;
}

const SalesStatement = () => {
    const accessDenied = checkPageAccess("Sales", "Statement");
    if (accessDenied) return accessDenied;

    const [rawData, setRawData] = useState<SalesStatementEntry[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Material: "",
        Party: "",
        Vehicle: "",
        Driver: "",
        Transporter: ""
    });

    const handleSearchSubmit = (formData: Filters) => {
        setAppliedFilters(formData);   // ✅ ADD THIS LINE
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
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post<SalesStatementResponse>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=SalesStatement`,
                filters
            );
            setRawData(res.data);
        } catch (err) {
            console.error("Error fetching sales statement data:", err);
        }
    };

    const materialList = useMemo(() => {
        const set = new Set<string>();
        rawData.forEach((r) => {
            if (r.Material) set.add(r.Material.trim());
        });
        return Array.from(set);
    }, [rawData]);

    const paymentList = useMemo(() => {
        const set = new Set<string>();
        rawData.forEach((r) => {
            if (r.Payment) set.add(r.Payment.trim());
        });
        return Array.from(set);
    }, [rawData]);

    const groupedData = useMemo(() => {
        const map: any = {};

        rawData.forEach((row) => {
            if (!map[row.DCNum]) {
                map[row.DCNum] = {
                    DCNum: row.DCNum,
                    Date1: row.Date1,
                    Time1: row.Time1,
                    Party: row.Party,
                    Destination: row.Destination,
                    Vehicle: row.Vehicle,

                    NettWeight: 0,
                    Weight: row.Nett,
                    Rate: row.Rate,
                    TransporterAmount: Number(row.TransporterAmount ?? 0),
                    TotalAmount: Number(row.TotalAmount ?? 0),
                    Discount: Number(row.Discount ?? 0),
                    Amount:
                        Number(row.ReceiptAmount ?? 0) + Number(row.Less ?? 0) +
                        Number(row.TransporterAmount ?? 0),          // ✅ CALCULATED
                    ReceiptAmount: Number(row.ReceiptAmount ?? 0),
                };


                // Initialize material columns
                materialList.forEach((m) => {
                    map[row.DCNum][m] = "";
                });

                // Initialize payment columns
                paymentList.forEach((p) => {
                    map[row.DCNum][p] = "";
                });
            }

            // Add nett into total
            map[row.DCNum].NettWeight += Number(row.Nett);

            // Fill material nett value
            map[row.DCNum][row.Material] = row.Nett;

            // Fill payment value
            map[row.DCNum][row.Payment] = row.ReceiptAmount;
        });

        return Object.values(map);
    }, [rawData, materialList, paymentList]);

    const headers = useMemo(() => {
        return [
            // String fields
            { label: "S.No", key: "sno", dataType: "index" },
            { label: "DC No", key: "DCNum", dataType: "string" },
            { label: "Date", key: "Date1", dataType: "string" },
            { label: "Time", key: "Time1", dataType: "string" },
            { label: "Party", key: "Party", dataType: "string" },
            { label: "Destination", key: "Destination", dataType: "string" },
            { label: "Vehicle", key: "Vehicle", dataType: "string" },

            // Numeric fields
            { label: "Nett Weight", key: "NettWeight", dataType: "string" },

            // Dynamic Material Columns → ALWAYS numeric
            ...materialList.map((mat) => ({
                label: mat,
                key: mat,
                dataType: "string",
            })),

            // Static numeric columns
            { label: "Weight", key: "Weight", dataType: "string" },
            { label: "Rate", key: "Rate", dataType: "number" },
            { label: "Total Amount", key: "Amount", dataType: "number" },

            // Dynamic Payment Columns → ALWAYS numeric
            ...paymentList.map((pay) => ({
                label: pay,
                key: pay,
                dataType: "number",
            })),
        ];
    }, [materialList, paymentList]);

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
                        title="Sales Statement"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={groupedData}
                        handleShow={() => setShowSearch(true)}
                    />
                )}
            </div>

            <SalesStatementSearch
                show={showSearch}
                handleClose={() => setShowSearch(false)}
                handleShow={() => setShowSearch(true)}
                handleSubmit={handleSearchSubmit}
            />
        </div>
    );
};

export default SalesStatement;

