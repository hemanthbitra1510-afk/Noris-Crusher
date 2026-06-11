import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import SalesSearch from "../salesSearch";
import { useToast } from "../../../components/reuse-components/Toast";
import ProductionList from "../../../components/reuse-components/productionList";
import SalesForm from "../salesFrom";
import SalesSummaryOffcanvas from "../salesSummary";
import ExcelUpload from "../../../components/reuse-components/exaclFileUpload";
import { Offcanvas, OffcanvasBody, OffcanvasHeader } from "react-bootstrap";
import BlukImport from "../../../components/reuse-components/blukImportOffCanvas";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface SalesReportEntry {
    [key: string]: string | number | null | undefined;
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
const SalesReports = () => {
    const accessDenied = checkPageAccess("Sales", "Sales Reports");
    if (accessDenied) return accessDenied;

    const [materialTop, setMaterialTop] = useState<SalesReportEntry[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [fromData, setFromData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummary, setShowSummary] = useState(false); // ✅ state for summary
    const [showImport, setShowImport] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    const bulkUpdateFields = [
        { label: "Party", key: "Party", type: "text" as const },
        { label: "Material", key: "Material", type: "text" as const },
        { label: "Destination", key: "Destination", type: "text" as const },
        { label: "Transporter", key: "Transporter", type: "text" as const },
        { label: "Driver", key: "Driver", type: "text" as const },
        { label: "Rate", key: "Rate", type: "number" as const },
    ];

    const [excelData, setExcelData] = useState<any[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filters>({
        FromDate: "",
        ToDate: "",
        Material: "",
        Party: "",
        Vehicle: "",
        Driver: "",
        Transporter: ""
    });
    const isBlocked = (value: any) => {
        if (value === null || value === undefined) return false;

        const val = String(value).toLowerCase();

        return (
            val === "yes" ||
            val === "blocked" ||
            val === "1" ||
            val === "true"
        );
    };

    const showToast = useToast();
    const selectedId = sessionStorage.getItem("selectedItems") ?? "";
    const isRoyalityId = selectedId === "IMIE25072022";

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
        { label: "Gross", key: "Gross", dataType: "number" },
        { label: "Tare", key: "Tare", dataType: "number" },
        { label: "Net", key: "Nett", dataType: "number" },
        { label: "Rate", key: "Rate", dataType: "number" },
        { label: "Amount", key: "ReceiptAmount", dataType: "number" },
        { label: "Transport", key: "Transport", dataType: "number" },
        { label: "Transport (Net)", key: "TransportForNet", dataType: "number" },
        { label: isRoyalityId ? "Royality" : "Less", key: "Less", dataType: "number" },
        
        { label: "Total", key: "TotalAmount", dataType: "number" },
        { label: "Payment", key: "Payment", dataType: "string" },
        { label: "Stationary", key: "Stationary", dataType: "string" },
        { label: "Image", key: "__image", dataType: "string" }, // ✅ NEW
        { label: "Blocked", key: "Blocked", dataType: "string" },
    ];
    useEffect(() => {
        // ✅ Add animation keyframes
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
        document.head.appendChild(style);

        // ✅ Load initial data
        const loadInitial = async () => {
            setLoading(true);
            await apiGet();
            setLoading(false);
        };

        loadInitial();

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const apiGet = async (customFilters?: Filters) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const activeFilters = customFilters || appliedFilters || filters;

            const res = await axios.post<SalesReportEntry[]>(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=SalesReport`,
                {
                    FromDate: activeFilters.FromDate,
                    ToDate: activeFilters.ToDate,
                    Material: activeFilters.Material,
                    Party: activeFilters.Party,
                    Vehicle: activeFilters.Vehicle,
                    Driver: activeFilters.Driver,
                    Transporter: activeFilters.Transporter
                }
            );


            // Calculate TotalAmount for each record
            const updatedData = res.data.map((entry) => {
                const receiptAmount = parseFloat(entry.ReceiptAmount) || 0;
                const transport = parseFloat(entry.Transport) || 0;
                const less = parseFloat(entry.Less) || 0;

                const gross = parseFloat(entry.Gross) || 0;
                const tare = parseFloat(entry.Tare) || 0;
                const nett = parseFloat(entry.Nett) || 0;

                const totalAmount = receiptAmount + transport + (less);

                const transportForNet = (nett / 1000) * transport;
                const lessForNet = less * (nett / 1000);
                const netTotal = receiptAmount + transportForNet - lessForNet;

                return {
                    ...entry,

                    // ✅ Divide by 1000 and keep 2 decimals
                    Gross: (gross).toFixed(2),
                    Tare: (tare).toFixed(2),
                    Nett: (nett).toFixed(2),

                    Stationary: entry.Stationary && entry.Stationary.trim() !== "" ? entry.Stationary : "0",
                    TotalAmount: totalAmount.toFixed(2),
                    TransportForNet: transportForNet.toFixed(2),
                    LessForNet: lessForNet.toFixed(2),
                    NetTotal: netTotal.toFixed(2),
                };
            });

            setMaterialTop(updatedData);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        }
    };

    const handleSearchSubmit = async (formData: Filters) => {
        setShowSearch(false);
        setAppliedFilters(formData);

        setLoading(true);            // ✅ START LOADING

        try {
            await apiGet(formData);
        } finally {
            setLoading(false);       // ✅ STOP LOADING
        }
    };
    const periodOptions = ["All", "This Month", "Last Month", "This Year"];
    const handleEdit = (deal: any) => {
        setFromData(deal)
        setShowForm(true)
    }
    const handleSubmit = async (payload: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) return;

            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=UpdateWeighmentRecord`,
                {
                    IDS: payload.ID,
                    Typed: payload.Typed,
                    Vehicle: payload.Vehicle,
                    Party: payload.Party,
                    Material: payload.Material,
                    Destination: payload.Destination,
                    Transporter: payload.Transporter,
                    Driver: payload.Driver,
                    Gross: payload.Gross,
                    Tare: payload.Tare,
                    Nett: payload.Nett,
                    Rate: payload.Rate,
                    Amount: payload.Amount,
                    Transport: payload.Transport,
                    Less: payload.Less,
                    TotalAmount: payload.TotalAmount,
                    Payment: payload.Payment,
                    Stationary: payload.Stationary,
                }
            );

            // ✅ CHECK RESPONSE PROPERLY
            if (res.data?.status === "Success") {
                showToast("Success", res.data?.message || "Record updated successfully", "success");

                setShowForm(false);   // close modal
                apiGet();             // refresh table
            } else {
                showToast("Error", res.data?.message || "Update failed", "danger");
            }

        } catch (err) {
            console.error(err);
            showToast("Error", "Server error occurred", "danger");
        }
    };

    const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const updatePromises = ids.map(recordId => {
                const deal = materialTop.find(d => d.ID === recordId);
                if (!deal) return Promise.resolve();

                return axios.post(
                    `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=UpdateWeighmentRecord`,
                    {
                        ...deal,
                        IDS: recordId,
                        [field]: value
                    }
                );
            });

            await Promise.all(updatePromises);
            showToast("Success", `Updated ${ids.length} records successfully`, "success");
            setSelectedIds([]);
            apiGet();
        } catch (err) {
            console.error("Bulk update failed:", err);
            showToast("Error", "Failed to update some records", "danger");
        }
    };


    const handleSummary = () => {
        setShowSummary(true);
    };
    const handleExcelSubmit = (data: any[]) => {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            setExcelHeaders(keys);
            setExcelData(data);
            setShowImport(true); // open preview offcanvas
        }
        setShowExcelModal(false);
    };
    const handleImport = () => setShowExcelModal(true);

    const uploadBulk = async (rows: any[]) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const promises = rows.map(row =>
                axios.post(`https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=UpdateWeighmentRecord`, row)
            );
            await Promise.all(promises);
            showToast("Success", "Bulk data imported successfully", "success");
            setShowImport(false);
            apiGet();
        } catch (err) {
            console.error("Bulk import failed:", err);
            showToast("Error", "Failed to import bulk data", "danger");
        }
    };

    const handleBulkUpload = async (data: any[]) => {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const mappedData = data.map(item => ({
            DCNumber: item.DCNumber || item.DCNum || item["DC No."] || "",
            Discount: item.Discount || "",
            Vehicle: item.Vehicle || "",
            Material: item.Material || "",
            Party: item.Party || "",
            Destination: item.Destination || "",
            Units: item.Units || "",
            Gross: item.Gross || "",
            GrossDate: item.GrossDate || item.Date || item.Date1 || "",
            GrossTime: item.GrossTime || item.Time || item.Time1 || "",
            Tare: item.Tare || "",
            TareDate: item.TareDate || "",
            TareTime: item.TareTime || "",
            Nett: item.Nett || "",
            Transport: item.Transport || "",
            Payment: item.Payment || "",
            Transporter: item.Transporter || "",
            Rate: item.Rate || "",
            ReceiptAmount: item.ReceiptAmount || item.Amount || "",
            Source: item.Source || "",
            Stationary: item.Stationary || "",
            Less: item.Less || "",
            Driver: item.Driver || "",
            Km: item.Km || "",
            FirstDateTime: item.FirstDateTime || ""
        }));

        try {
            // Sending as a standard array in one request to Bulkupdate.php or Sales.php
            // Usually for bulk updates we use a bulk endpoint.
            // However, the user said "similar use this payload for sales reports".
            // In Quarry reports I used Bulkupdate.php?Table=Quarry.
            // For Sales, I'll use Bulkupdate.php?Table=Sales if available, or stay consistent.
            await axios.post(
                `https://norisapi.noris.in/Crusher/Bulkupdate.php?ID=${id}&Table=Sales`,
                mappedData
            );
        } catch (err) {
            console.error("Bulk upload error:", err);
            throw err;
        }
    };
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
                                    width: 75,
                                    height: 75,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <ProductionList
                        title="Sales Report"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        handleEdit={hasPermission("Sales", "Reports", "Updated") ? handleEdit : undefined}
                        appliedFilters={appliedFilters}
                        handleSummary={handleSummary}
                        handleImport={handleImport}
                        handleShow={() => setShowSearch(true)}
                        rowClassName={(row: SalesReportEntry) =>
                            isBlocked(row.Blocked) ? "blocked-row" : ""
                        }
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkUpdateFields={bulkUpdateFields}
                        onBulkUpdateSave={handleBulkUpdateSave}
                        onSuccess={() => apiGet()}
                        onBulkUpload={hasPermission("Sales", "Reports", "Added") ? handleBulkUpload : undefined}
                    />
                )}
                <SalesSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
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
                <ExcelUpload
                    show={showExcelModal}
                    onHide={() => setShowExcelModal(false)}
                    onSubmit={handleExcelSubmit}
                />

                {/* Offcanvas Bulk Import Preview */}
                <Offcanvas
                    show={showImport}
                    onHide={() => setShowImport(false)}
                    placement="end"
                    style={{ width: "80%" }}
                >
                    <OffcanvasHeader closeButton>
                        <div>
                            <h5 className="mb-0 text-primary">Bulk Import - Quarry Contractor</h5>
                            <small className="text-muted">Preview Imported Excel Data</small>
                        </div>
                    </OffcanvasHeader>

                    <OffcanvasBody>
                        <BlukImport
                            tableHeaders={excelHeaders.map(h => ({ label: h, key: h }))}
                            dealsData={excelData}
                            onUpload={(rows) => {
                                console.log("Selected rows:", rows);
                                uploadBulk(rows);
                            }}
                        />
                    </OffcanvasBody>
                </Offcanvas>
            </div>
        </div>
    );
};

export default SalesReports;
