import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SearchModal from "./searchModal";
import { hasPermission } from "../../utils/permission";
import axios from "axios";
import { useToast } from "./Toast";
import Select from "react-select";
import { Modal, Form, Button as RBButton } from "react-bootstrap";

interface DashboardListRow {
    [key: string]: string | number | null | undefined;
}

interface TableHeader {
    label: string;
    key: string;
    dataType?: string;
}

interface DashboardListProps {
    changeColor?: (deal: DashboardListRow, key: string) => string;
    title: string;
    show: boolean;
    periodOptions: string[];
    defaultValues?: any;
    tableHeaders: TableHeader[];
    dealsData: DashboardListRow[];
    linkField?: string;
    linkRoute?: string;
    statusField?: string;
    periodField?: string;
    onAddClick?: () => void;
    handleEdit?: (deal: DashboardListRow) => void;
    handleDelete?: (deal: DashboardListRow) => void;
    handleSubmit1?: (formData: any) => void;
    handleShow?: () => void;
    handleClose?: () => void;
    handleSummary?: (deal: DashboardListRow) => void;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    bulkUpdateFields?: { label: string; key: string; type?: "text" | "number" | "date" | "select"; options?: { label: string; value: any }[] }[];
    onBulkUpdateSave?: (field: string, value: any, ids: (string | number)[]) => Promise<void>;
    onImageClick?: (images: string | string[]) => void;
    // RBAC
    mainModule?: string;
    subModule?: string;
    onSuccess?: () => void;
    onBulkUpload?: (data: any[]) => Promise<void>;
}

const RepotsList = ({
    changeColor,
    title,
    show,
    periodOptions,
    tableHeaders,
    dealsData,
    linkField,
    linkRoute,
    defaultValues,
    statusField,
    periodField,
    onAddClick,
    handleEdit,
    handleDelete,
    handleSubmit1,
    handleShow,
    handleClose,
    handleSummary,
    selectedIds = [],
    onSelectionChange,
    bulkUpdateFields,
    onBulkUpdateSave,
    onImageClick,
    mainModule = "",
    subModule = "",
    onSuccess,
    onBulkUpload,
}: DashboardListProps) => {
    const showToast = useToast();
    const canBulkUpdate = mainModule && subModule ? hasPermission(mainModule, subModule, "Updated") : true;

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [searchText, setSearchText] = useState("");
    const [filteredDeals, setFilteredDeals] = useState(dealsData);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
    const [selectedPeriod] = useState<string>(periodOptions[0]);
    const [showBulkUpdate, setShowBulkUpdate] = useState(false);
    const [bulkField, setBulkField] = useState("");
    const [bulkValue, setBulkValue] = useState("");
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        senderName: "",
        senderEmail: "",
        ccEmail: ""
    });
    const [isSending, setIsSending] = useState(false);
    const [startTime] = useState<string>("");
    const [endTime] = useState<string>("");

    const prevSearchText = useRef(searchText);
    const prevSelectedPeriod = useRef(selectedPeriod);
    const prevPeriodField = useRef(periodField);
    const prevStartTime = useRef(startTime);
    const prevEndTime = useRef(endTime);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBulkUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            if (onBulkUpload) {
                showToast("Info", "Processing Bulk Upload...", "info");
                try {
                    await onBulkUpload(data);
                    showToast("Success", "Bulk Upload Completed!", "success");
                    onSuccess?.();
                } catch (error) {
                    showToast("Error", "Bulk Upload Failed.", "danger");
                }
            }
            e.target.value = "";
        };
        reader.readAsBinaryString(file);
    };

    const sortedDeals = [...filteredDeals].sort((a, b) => {
        if (!sortKey) return 0;
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? -1 : 1;
        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });

    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentDeals = sortedDeals.slice(startIndex, startIndex + itemsPerPage);

    const isAllSelected = currentDeals.length > 0 && currentDeals.every(d => selectedIds.includes(d.ID as any));
    const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const currentIds = currentDeals.map(d => d.ID as any);
            const otherSelected = selectedIds.filter(id => !currentDeals.some(d => d.ID === id));
            onSelectionChange?.([...otherSelected, ...currentIds]);
        } else {
            const otherSelected = selectedIds.filter(id => !currentDeals.some(d => d.ID === id));
            onSelectionChange?.(otherSelected);
        }
    };

    const handleSelectRow = (id: string | number) => {
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter((idx) => idx !== id)
            : [...selectedIds, id];
        onSelectionChange?.(newSelected);
    };

    const handleInternalBulkSave = async () => {
        if (!bulkField || !bulkValue || !onBulkUpdateSave) return;
        setIsSavingBulk(true);
        try {
            await onBulkUpdateSave(bulkField, bulkValue, selectedIds);
            onSuccess?.();
            setShowBulkUpdate(false);
            setBulkField("");
            setBulkValue("");
        } finally {
            setIsSavingBulk(false);
        }
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const getStatusBadgeColor = (status: string) => {
        return status === "Won" ? "bg-success" : "bg-danger";
    };

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            const lowercasedSearchText = searchText.toLowerCase();
            const newFilteredDeals = dealsData.filter((deal) => {
                const matchesSearchText = tableHeaders.some((header) => {
                    const value = deal[header.key];
                    return value !== null && value !== undefined && String(value).toLowerCase().includes(lowercasedSearchText);
                });
                const matchesPeriod = selectedPeriod === "All" || (periodField && deal[periodField] && (() => {
                    const recordDateTime = new Date(String(deal[periodField]));
                    if (startTime && endTime) {
                        const recordTime = recordDateTime.getHours() * 60 + recordDateTime.getMinutes();
                        const [startH, startM] = startTime.split(":").map(Number);
                        const [endH, endM] = endTime.split(":").map(Number);
                        const startTotal = startH * 60 + startM;
                        const endTotal = endH * 60 + endM;
                        return recordTime >= startTotal && recordTime <= endTotal;
                    }
                    return true;
                })());
                return matchesSearchText && matchesPeriod;
            });

            const filterChanged =
                prevSearchText.current !== searchText ||
                prevSelectedPeriod.current !== selectedPeriod ||
                prevPeriodField.current !== periodField ||
                prevStartTime.current !== startTime ||
                prevEndTime.current !== endTime;

            setFilteredDeals(newFilteredDeals);

            if (filterChanged) {
                setCurrentPage(1);
            } else {
                const newTotalPages = Math.ceil(newFilteredDeals.length / itemsPerPage);
                setCurrentPage((prev) => Math.max(1, Math.min(prev, newTotalPages || 1)));
            }

            prevSearchText.current = searchText;
            prevSelectedPeriod.current = selectedPeriod;
            prevPeriodField.current = periodField;
            prevStartTime.current = startTime;
            prevEndTime.current = endTime;
        }, 300);
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchText, dealsData, selectedPeriod, periodField, startTime, endTime, tableHeaders, itemsPerPage]);

    const indianNumberFormatter = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalColumns = ["Gross", "Tare", "ActualNett", "Nett", "Amount"];
    const totals: Record<string, string> = {};

    tableHeaders.forEach((header) => {
        if (!totalColumns.includes(header.key)) {
            totals[header.key] = "";
            return;
        }
        let sum = 0;
        filteredDeals.forEach((deal) => {
            if (deal.Blocked === "Blocked") return; // Skip blocked rows for totals
            const raw = deal[header.key];
            const num = Number(String(raw ?? 0).replace(/,/g, ""));
            if (!isNaN(num)) sum += num;
        });
        if (["Gross", "Tare", "ActualNett", "Nett"].includes(header.key)) {
            totals[header.key] = indianNumberFormatter.format(sum / 1000);
        } else if (header.key === "Amount") {
            totals[header.key] = `₹ ${indianNumberFormatter.format(sum)}`;
        } else {
            totals[header.key] = indianNumberFormatter.format(sum);
        }
    });

    const generatePdf = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a3",
        });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const selectedCompanyRaw = sessionStorage.getItem("selectedItems1");
        let companyName = "Company Name";

        if (selectedCompanyRaw) {
            try {
                const parsedCompany = JSON.parse(selectedCompanyRaw);
                companyName = parsedCompany?.Name || "Company Name";
            } catch (err) {
                console.error("Company parse error", err);
            }
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(companyName, pageWidth / 2, 10, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        let startY = 16;

        const filters: string[] = [];
        if (searchText) filters.push(`Search: ${searchText}`);
        if (defaultValues) {
            Object.entries(defaultValues).forEach(([key, value]) => {
                if (value) filters.push(`${key}: ${value}`);
            });
        }

        if (filters.length > 0) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Filters Applied:", 14, startY);
            doc.setFont("helvetica", "normal");
            startY += 5;
            const splitText = doc.splitTextToSize(filters.join(" | "), pageWidth - 20);
            doc.text(splitText, 14, startY);
            startY += splitText.length * 5;
        }

        const exportHeaders = tableHeaders.filter(
            (header) => header.key !== "Blocked" && header.key !== "__image"
        );

        const rows = sortedDeals
            .filter((deal) => deal.Blocked !== "Blocked")
            .map((deal, index) =>
            exportHeaders.map((header) => {
                if (header.dataType === "index") return index + 1;
                const value = deal[header.key];
                if (header.dataType === "number") {
                    const num = Number(String(value ?? 0).replace(/,/g, ""));
                    return isNaN(num) ? "" : num.toFixed(2);
                }
                return value ?? "";
            })
        );

        autoTable(doc, { 
            startY: startY,
            head: [exportHeaders.map((h) => h.label)], 
            body: rows,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", cellWidth: "auto" },
            headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold", halign: "center" },
            tableWidth: "auto",
            margin: { left: 8, right: 8 },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.text(`Page ${data.pageNumber}`, pageWidth - 20, pageHeight - 5);
            },
        });
        return doc;
    };

    const handleExportPdf = () => {
        const doc = generatePdf();
        doc.save(`${title}.pdf`);
    };

    const handleMailPdf = () => {
        setShowEmailModal(true);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        showToast("Info", "Generating PDF and sending email...", "info");
        const doc = generatePdf();
        const base64Content = doc.output('datauristring').split(',')[1];
        const fileName = `${title}.pdf`;
        const mailUrl = "https://norissolutions.in/SendMail/MailAttachment.php";
        
        const selectedCompanyRaw = sessionStorage.getItem("selectedItems1");
        let companyName = "Company Name";
        if (selectedCompanyRaw) {
            try {
                const parsedCompany = JSON.parse(selectedCompanyRaw);
                companyName = parsedCompany?.Name || "Company Name";
            } catch (err) {
                console.error("Company parse error", err);
            }
        }

        try {
            const response = await axios.post(mailUrl, {
                SenderEmail: emailData.senderEmail,
                SenderName: emailData.senderName,
                Subject: `Report: ${title}`,
                message: "Please find the attached spreadsheet report.",
                filename: fileName,
                filedata: base64Content,
                CC: emailData.ccEmail,
                CompanyName: companyName
            });
            if (response.status === 200) {
                showToast("Success", "Email sent successfully!", "success");
                setShowEmailModal(false);
            } else {
                showToast("Error", "Failed to send email.", "danger");
            }
        } catch (error) {
            console.error("Mail Error:", error);
            showToast("Error", "An error occurred while sending the email.", "danger");
        } finally {
            setIsSending(false);
        }
    };

    const handleExportExcel = () => {
        const exportData = filteredDeals
            .filter((deal) => deal.Blocked !== "Blocked")
            .map((deal) => {
            const obj: Record<string, string | number> = {};
            tableHeaders.forEach((h) => { obj[h.label] = deal[h.key] ?? ""; });
            return obj;
        });

        const totalsRow: Record<string, string | number> = {};
        tableHeaders.forEach((h, i) => {
            totalsRow[h.label] = i === 0 ? "Total" : (totals[h.key] || "");
        });
        exportData.push(totalsRow);

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `${title}.xlsx`);
    };

    return (
        <div className="d-flex flex-column">
            <div className="card shadow-sm rounded-3 m-1">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-4">
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control ps-5 pe-5 rounded"
                                    placeholder="Search..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ border: "1px solid #dee2e6", boxShadow: "none" }}
                                />
                                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-primary" style={{ pointerEvents: "none" }} />
                                {searchText && (
                                    <button type="button" className="btn btn-sm border-0 bg-transparent position-absolute top-50 end-0 translate-middle-y me-2" onClick={() => setSearchText("")}>
                                        <i className="bi bi-x-lg text-primary"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <SearchModal
                                show={show}
                                handleClose={handleClose || (() => {})}
                                handleShow={handleShow || (() => {})}
                                handleSubmit={handleSubmit1 || (() => {})}
                                defaultValues={defaultValues}
                            />
                        </div>
                        <div className="col-12 col-md-5 d-flex justify-content-md-end flex-wrap gap-2">
                            <button className="btn btn-outline-primary shadow d-flex align-items-center" onClick={() => handleSummary?.({ID: 0})}>Summary</button>
                            <button className="btn btn-outline-primary shadow d-flex align-items-center" onClick={handleExportExcel} title="Download Excel"><i className="ti ti-file-spreadsheet fs-4"></i></button>
                            <button className="btn btn-outline-primary shadow d-flex align-items-center" onClick={handleExportPdf} title="Download PDF"><i className="ti ti-file-type-pdf fs-4"></i></button>
                            <button className="btn btn-outline-primary shadow d-flex align-items-center" onClick={handleMailPdf} title="Send Mail"><i className="ti ti-mail fs-4"></i></button>
                            {onBulkUpload && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: "none" }}
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        className="btn btn-outline-success shadow d-flex align-items-center gap-2"
                                        onClick={handleBulkUploadClick}
                                        title="Bulk Upload Excel"
                                    >
                                        <i className="ti ti-upload fs-4"></i>
                                    </button>
                                </>
                            )}
                            {onAddClick && (
                                <button className="btn btn-primary shadow d-flex align-items-center" onClick={onAddClick}><i className="bi bi-plus-lg me-1"></i> Add</button>
                            )}
                            {selectedIds.length > 0 && bulkUpdateFields && canBulkUpdate && (
                                <button className="btn btn-warning shadow d-flex align-items-center gap-2" onClick={() => setShowBulkUpdate(true)}>
                                    <i className="bi bi-pencil-square"></i> Bulk Update ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Applied Filters Display */}
            {defaultValues && Object.values(defaultValues).some(v => v !== "" && v !== null && v !== undefined) && (
                <div className="mx-1 mb-2 d-flex align-items-center flex-wrap gap-2 px-2 py-2 bg-light rounded shadow-sm border border-secondary border-opacity-10">
                    <span className="text-muted fw-bold small me-1">
                        <i className="bi bi-funnel text-primary me-1"></i>Applied Filters:
                    </span>
                    {(() => {
                        const chips = [];
                        const processedKeys = new Set();
                        const filterObj = defaultValues as Record<string, any>;

                        // 1. Handle Date Range (FromDate + ToDate)
                        if (filterObj.FromDate && filterObj.ToDate) {
                            // Formatting datetime-local strings for cleaner display if they contain 'T'
                            const formatDT = (dt: string) => dt.includes('T') ? dt.replace('T', ' ') : dt;
                            
                            chips.push(
                                <div key="date-range" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar3 text-primary me-2"></i>
                                    Date Range: <span className="text-primary ms-1">{formatDT(String(filterObj.FromDate))}</span> <span className="mx-2 text-muted">to</span> <span className="text-primary">{formatDT(String(filterObj.ToDate))}</span>
                                </div>
                            );
                            processedKeys.add("FromDate");
                            processedKeys.add("ToDate");
                        } else if (filterObj.FromDate) {
                            chips.push(
                                <div key="from-date" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    From: <span className="text-primary ms-1">{String(filterObj.FromDate)}</span>
                                </div>
                            );
                            processedKeys.add("FromDate");
                        } else if (filterObj.ToDate) {
                            chips.push(
                                <div key="to-date" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    To: <span className="text-primary ms-1">{String(filterObj.ToDate)}</span>
                                </div>
                            );
                            processedKeys.add("ToDate");
                        }

                        // 2. Handle other filters
                        Object.entries(filterObj).forEach(([key, value]) => {
                            if (value && !processedKeys.has(key)) {
                                chips.push(
                                    <div key={key} className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                        <span className="text-muted me-1">{key}:</span> <span className="text-primary">{String(value)}</span>
                                    </div>
                                );
                            }
                        });

                        return chips;
                    })()}
                </div>
            )}

            <div className="card rounded-3 m-1">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle text-nowrap">
                            <thead className="table-light">
                                <tr>
                                    {onSelectionChange && (
                                        <th className="bg-primary bg-opacity-10 text-center" style={{ width: "40px" }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={isAllSelected}
                                                ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    {tableHeaders.map((header, index) => (
                                        <th key={index} className="bg-primary bg-opacity-10 text-primary cursor-pointer" onClick={() => handleSort(header.key)}>
                                            <div className={header.dataType === "number" ? "text-end" : "text-start"}>
                                                <span>{header.label}</span>
                                                {sortKey === header.key && <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>}
                                            </div>
                                        </th>
                                    ))}
                                    {(handleEdit || handleDelete) && (
                                        <th className="bg-primary bg-opacity-10 text-primary text-center">Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <style>
                                {`
                                    @media print {
                                        tr.text-decoration-line-through,
                                        tr[class*="text-decoration-line-through"] {
                                            display: none !important;
                                        }
                                    }
                                `}
                            </style>

                            <tbody>
                                {currentDeals.length > 0 ? (
                                    currentDeals.map((deal, index) => (
                                        <tr key={index} className={`border-top ${deal.Blocked === "Blocked" ? "text-decoration-line-through" : ""}`}>
                                            {onSelectionChange && (
                                                <td className="text-center py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedIds.includes(deal.ID as any)}
                                                        onChange={() => handleSelectRow(deal.ID as any)}
                                                    />
                                                </td>
                                            )}
                                            {tableHeaders.map((header, i) => {
                                                if (header.dataType === "index") {
                                                    return <td key={i} className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>;
                                                }
                                                const value = deal[header.key];
                                                const alignmentClass = header.dataType === "number" ? "text-end" : "text-start";
                                                return (
                                                    <td key={i} className={`py-3 ${alignmentClass}`}>
                                                        {linkField && header.key === linkField ? (
                                                            <Link to={linkRoute || "#"} className="text-primary fw-bold text-decoration-none">{value}</Link>
                                                        ) : statusField && header.key === statusField ? (
                                                            <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeColor(String(value))}`}>{value}</span>
                                                        ) : (
                                                                <span
                                                                    className={changeColor ? changeColor(deal, header.key) : "text-dark"}
                                                                    onClick={() => { if (header.dataType === "image" && onImageClick) onImageClick(value as any); }}
                                                                    style={header.dataType === "image" ? { cursor: "pointer" } : {}}
                                                                >
                                                                    {header.dataType === "image" && value ? (
                                                                        <div className="d-flex gap-1">
                                                                            {Array.isArray(value) ? (
                                                                                value.map((img, idx1) => (
                                                                                    <img key={idx1} src={img} alt="report" style={{ height: "30px", width: "30px", borderRadius: "4px", objectFit: "cover" }} />
                                                                                ))
                                                                            ) : (
                                                                                <img src={String(value)} alt="report" style={{ height: "30px", width: "30px", borderRadius: "4px", objectFit: "cover" }} />
                                                                        )}
                                                                        </div>
                                                                    ) : (
                                                                        header.dataType === "number" && ["Gross", "Tare", "ActualNett", "Nett", "Stationary"].includes(header.key)
                                                                            ? indianNumberFormatter.format(Number(String(value ?? 0).replace(/,/g, "")) / 1000)
                                                                            : value
                                                                    )}
                                                                </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {(handleEdit || handleDelete) && (
                                                <td className="text-center py-3">
                                                    <div className="dropdown table-action">
                                                        <button type="button" className="action-icon btn btn-xs shadow btn-icon btn-outline-light" data-bs-toggle="dropdown"><i className="ti ti-dots-vertical"></i></button>
                                                        <div className="dropdown-menu dropdown-menu-end">
                                                            {handleEdit && deal.BlockButton === "Blocked" && (
                                                                <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => handleEdit(deal)}><i className="ti ti-edit text-blue me-2 text-primary"></i> Edit</button>
                                                            )}
                                                            {handleDelete && (
                                                                <button type="button" className="dropdown-item d-flex align-items-center" onClick={() => handleDelete(deal)}><i className="ti ti-ban me-2 text-danger"></i> {deal.BlockButton}</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={tableHeaders.length + 2} className="text-center py-5"><i className="bi bi-search display-6 text-muted d-block mb-2"></i><span className="text-muted">No data available</span></td></tr>
                                )}
                                <tr className="table-light fw-bold">
                                    {onSelectionChange && <td className="bg-light"></td>}
                                    {tableHeaders.map((header, i) => {
                                        if (i === 0) return <td key={i}>Total</td>;
                                        return <td key={i} className={header.dataType === "number" ? "text-end" : "text-start"}>{totals[header.key] ?? ""}</td>;
                                    })}
                                    {(handleEdit || handleDelete) && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                {filteredDeals.length > 0 && (
                    <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                className="form-select form-select-sm w-auto shadow-sm"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[5, 10, 20, 30, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                            <span className="ms-2 text-muted small">
                                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredDeals.length)} of {filteredDeals.length}{" "}
                                records
                            </span>
                        </div>
                        {totalPages > 1 && (
                            <nav className="mx-md-auto ms-auto">
                                <ul className="pagination flex-wrap mb-0">
                                    {/* Previous */}
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link shadow-sm"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>

                                    {/* First page */}
                                    <li className={`page-item ${currentPage === 1 ? "active" : ""}`}>
                                        <button className="page-link shadow-sm" onClick={() => setCurrentPage(1)}>
                                            1
                                        </button>
                                    </li>

                                    {/* Left ellipsis */}
                                    {currentPage > 3 && (
                                        <li className="page-item disabled">
                                            <span className="page-link border-0">...</span>
                                        </li>
                                    )}

                                    {/* Pages around current */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(
                                            (page) =>
                                                page !== 1 &&
                                                page !== totalPages &&
                                                Math.abs(page - currentPage) <= 1
                                        )
                                        .map((page) => (
                                            <li
                                                key={page}
                                                className={`page-item ${page === currentPage ? "active" : ""}`}
                                            >
                                                <button className="page-link shadow-sm" onClick={() => setCurrentPage(page)}>
                                                    {page}
                                                </button>
                                            </li>
                                        ))}

                                    {/* Right ellipsis */}
                                    {currentPage < totalPages - 2 && (
                                        <li className="page-item disabled">
                                            <span className="page-link border-0">...</span>
                                        </li>
                                    )}

                                    {/* Last page */}
                                    {totalPages > 1 && (
                                        <li
                                            className={`page-item ${currentPage === totalPages ? "active" : ""
                                                }`}
                                        >
                                            <button className="page-link shadow-sm" onClick={() => setCurrentPage(totalPages)}>
                                                {totalPages}
                                            </button>
                                        </li>
                                    )}

                                    {/* Next */}
                                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                        <button
                                            className="page-link shadow-sm"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                )}
            </div>

            {showBulkUpdate && (
                <div className="offcanvas-backdrop fade show" onClick={() => !isSavingBulk && setShowBulkUpdate(false)} style={{ cursor: "pointer", zIndex: 1045 }} />
            )}
            <div className={`offcanvas offcanvas-end ${showBulkUpdate ? "show" : ""}`} style={{ width: "400px", visibility: showBulkUpdate ? "visible" : "hidden", zIndex: 1050 }}>
                <div className="offcanvas-header bg-warning text-dark">
                    <h5 className="offcanvas-title fw-bold">Bulk Update ({selectedIds.length} Items)</h5>
                    <button className="btn-close" onClick={() => setShowBulkUpdate(false)} disabled={isSavingBulk}></button>
                </div>
                <div className="offcanvas-body d-flex flex-column">
                    <div className="alert alert-info py-2 small mb-3"><i className="bi bi-info-circle me-2"></i>Select a field and enter a new value to update all selected records.</div>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Select Field to Update</label>
                        <select className="form-select border-primary" value={bulkField} onChange={(e) => setBulkField(e.target.value)}>
                            <option value="">-- Select Field --</option>
                            {bulkUpdateFields?.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
                        </select>
                    </div>
                    {bulkField && (
                        <div className="mb-4">
                            <label className="form-label fw-semibold">New Value</label>
                            {(() => {
                                const fieldDef = bulkUpdateFields?.find(f => f.key === bulkField);
                                if (fieldDef?.type === "date") {
                                    return <input type="date" className="form-control border-primary" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} />;
                                }
                                if (fieldDef?.type === "number") {
                                    return <input type="number" className="form-control border-primary" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} />;
                                }
                                if (fieldDef?.type === "select" && fieldDef.options) {
                                    return (
                                        <Select
                                            options={fieldDef.options}
                                            value={fieldDef.options.find(opt => opt.value === bulkValue) || null}
                                            onChange={(selected) => setBulkValue(selected ? selected.value : "")}
                                            placeholder={`Select ${fieldDef.label}...`}
                                            isClearable
                                            isSearchable
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    borderColor: "#0d6efd",
                                                    "&:hover": { borderColor: "#0d6efd" }
                                                })
                                            }}
                                        />
                                    );
                                }
                                return <input type="text" className="form-control border-primary" placeholder="Enter new value..." value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} />;
                            })()}
                        </div>
                    )}
                    <div className="d-grid gap-2 mt-auto">
                        <button className="btn btn-primary btn-lg" disabled={!bulkField || !bulkValue || isSavingBulk} onClick={handleInternalBulkSave}>
                            {isSavingBulk ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : "Save Changes"}
                        </button>
                        <button className="btn btn-outline-secondary" onClick={() => setShowBulkUpdate(false)} disabled={isSavingBulk}>Cancel</button>
                    </div>
                </div>
            </div>
            {/* Email Details Modal */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Send {title} via Email</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEmailSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Sender Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={emailData.senderName}
                                onChange={(e) => setEmailData({ ...emailData, senderName: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Sender Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={emailData.senderEmail}
                                onChange={(e) => setEmailData({ ...emailData, senderEmail: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>CC Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter CC email (optional)"
                                value={emailData.ccEmail}
                                onChange={(e) => setEmailData({ ...emailData, ccEmail: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <RBButton variant="secondary" onClick={() => setShowEmailModal(false)}>
                            Cancel
                        </RBButton>
                        <RBButton variant="primary" type="submit" disabled={isSending}>
                            {isSending ? "Sending..." : "Send Email"}
                        </RBButton>
                    </Modal.Footer>
                </Form>
            </Modal>

        </div>
    );
};

export default RepotsList;
