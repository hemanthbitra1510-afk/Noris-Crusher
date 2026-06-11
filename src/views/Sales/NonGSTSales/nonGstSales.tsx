import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios"; import SalesSearch from "../salesSearch";
import { useToast } from "../../../components/reuse-components/Toast";
import ProductionList from "../../../components/reuse-components/productionList";
import SalesForm from "../salesFrom";
import SalesSummaryOffcanvas from "../salesSummary";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface NonGstSalesEntry {
    DCNum: string;
    Vehicle: string;
    Material: string;
    Party: string;
    Destination: string;
    Units: string;
    Rate: string;
    Nett: string;
    Amount: string;
    Transport: string;
    GST: string;
    TotalAmount: string;
    Driver: string;
    Operator: string;
    Date1: string;
    Time1: string;
    FirstDateTime: string;
    Discount: string;
    Payment: string;
    ClearedOn: string;
    Receiver: string;
    NBC: string;
    Gross: string;
    Tare: string;
    Phone: string;
    Transporter: string;
    ReceiptAmount: string;
    Blocked: string;
    Km: string;
    Source: string;
    ID: string;
    Approve: string;
    ApprovedBy: string;
    DateTime: string;
    AUnits: string;
    Less: string;
    Permit: string;
    Stationary: string;
    Royality: string;
    invoice: string;
    SGST: string;
    CGST: string;
    IGST: string;
    TransitPass: string;
    TransporterAmount: string;
    TRate: string;
    TareDate: string;
    TareTime: string;
    Typed: string;
}

interface Filters {
    FromDate: string;
    ToDate: string;
    Material: string;
    Party: string;
    Vehicle: string;
    Driver: string;
    Transporter: string
}
const NonGstSales = () => {
    const [materialTop, setMaterialTop] = useState<NonGstSalesEntry[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [fromData, setFromData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
    const [filters, setFilters] = useState<Filters>({
        FromDate: "",
        ToDate: "",
        Material: "",
        Party: "",
        Vehicle: "",
        Driver: "",
        Transporter: ""
    });

    const accessDenied = checkPageAccess("Sales", "Non GST Sales");

    const showToast = useToast();
    // Customize these columns as needed
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "DC No.", key: "DCNum", dataType: "string" },
        { label: "Date", key: "Date1", dataType: "string" },
        { label: "Time", key: "Time1", dataType: "string" },
        { label: "Vehicle", key: "Vehicle", dataType: "string" },
        { label: "Party", key: "Party", dataType: "string" },
        { label: "Material", key: "Material", dataType: "string" },
        { label: "Source", key: "Source", dataType: "string" },
        { label: "Destination", key: "Destination", dataType: "string" },
        { label: "Transporter", key: "Transporter", dataType: "string" },
        { label: "Driver", key: "Driver", dataType: "string" },

        // Numeric fields
        { label: "Gross", key: "Gross", dataType: "number" },
        { label: "Tare", key: "Tare", dataType: "number" },
        { label: "Net", key: "Nett", dataType: "number" },
        { label: "Rate", key: "Rate", dataType: "number" },
        { label: "Amount", key: "ReceiptAmount", dataType: "number" },
        { label: "Transport", key: "Transport", dataType: "number" },
        { label: "Less", key: "Less", dataType: "number" },
        { label: "Total", key: "TotalAmount", dataType: "number" },

        // Payment can be text or number; in most cases string
        { label: "Payment", key: "Payment", dataType: "string" },

        // Numeric (0,1 or actual amount)
        { label: "Stationary", key: "Stationary", dataType: "string" },

        // Status — string
        { label: "Blocked", key: "Blocked", dataType: "string" },
    ];
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
    }, [filters, accessDenied]);

    const apiGet = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post<NonGstSalesEntry[]>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=SalesNonReport`,
                {
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate,
                    Material: filters.Material,
                    Party: filters.Party,
                    Vehicle: filters.Vehicle,
                    Driver: filters.Driver,
                    Transporter: filters.Transporter
                }
            );

            // Safely map and calculate TotalAmount
            const updatedData = res.data.map((entry) => {
                const receipt = parseFloat(entry.ReceiptAmount) || 0;
                const transport = parseFloat(entry.Transport) || 0;
                const less = parseFloat(entry.Less) || 0;

                const gross = parseFloat(entry.Gross) || 0;
                const tare = parseFloat(entry.Tare) || 0;
                const nett = parseFloat(entry.Nett) || 0;

                return {
                    ...entry,

                    Gross: Number((gross).toFixed(2)),
                    Tare: Number((tare).toFixed(2)),
                    Nett: Number((nett).toFixed(2)),

                    Stationary: entry.Stationary && entry.Stationary.trim() !== "" ? entry.Stationary : "0",
                    TotalAmount: Number((receipt + transport - less).toFixed(2)),
                };
            });
            setMaterialTop(updatedData);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (formData: Filters) => {
        setAppliedFilters(formData);
        setFilters(formData);
        setShowSearch(false);
    };
    const periodOptions = ["All", "This Month", "Last Month", "This Year"];
    const handleEdit = (deal: any) => {
        setFromData(deal)
        setShowForm(true)
    }
    const handleSummary = () => {
        setShowSummary(true);
    };
    const handleSubmit = async (data: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const data1 = {
                ...data,
                IDS: data.ID
            }
            delete data1.ID
            const res = await axios.post<NonGstSalesEntry[]>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=UpdateWeighmentRecord`, data1
            );
            apiGet();
            setShowForm(false)
            showToast(
                "Success",
                "Non-Gst-Sales Updated",
                "success"
            );
        } catch (err: unknown) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    }
    if (accessDenied) return accessDenied;

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
                        title="Non-GST Sales Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        handleEdit={hasPermission("Sales", "Non GST Sales", "Updated") ? handleEdit : undefined}
                        handleSummary={handleSummary}
                        appliedFilters={appliedFilters}
                        onSuccess={apiGet}
                        handleShow={() => setShowSearch(true)}
                    />)}
                <SalesSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                    initialFilters={appliedFilters}
                />
                <SalesForm
                    show={showForm}
                    onClose={() => setShowForm(false)}
                    onSubmit={(data) => {
                        handleSubmit(data)
                        setShowForm(false);
                    }}
                    initialData={fromData}
                />
                <SalesSummaryOffcanvas
                    show={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={materialTop}
                />
            </div>
        </div>
    );
};

export default NonGstSales;

