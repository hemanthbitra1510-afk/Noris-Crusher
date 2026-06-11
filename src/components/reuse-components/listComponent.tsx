import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button, Offcanvas, Modal, Form } from "react-bootstrap";
import TableSkeleton from "./tableSkeleton";
import { hasPermission } from "../../utils/permission";
import axios from "axios";
import { useToast } from "./Toast";

interface DashboardListRow {
    [key: string]: string | number | null | undefined | any;
}
interface TableHeader {
    label: string;
    key: string;
    dataType?: "number" | "index" | "action" | "string";
    align?: "start" | "end" | "center";
    showTotal?: boolean;
}

interface BulkUpdateField {
    label: string;
    key: string;
    type?: "text" | "date" | "number";
}

interface DashboardListProps {
    title: string;
    handleShow?: () => void;
    periodOptions: string[];
    tableHeaders: TableHeader[];
    dealsData: DashboardListRow[];
    linkField?: string;
    linkRoute?: string;
    customCellRenderer?: (value: any, row: any, key: string) => React.ReactNode;
    statusField?: string;
    appliedFilters?: any;
    periodField?: string;
    showTotal?: boolean;
    loading?: boolean;
    onAddClick?: () => void;
    handleEdit?: (deal: DashboardListRow) => void;
    handleDelete?: (deal: DashboardListRow) => void;
    handleView?: (deal: DashboardListRow) => void;
    handleSummary?: (deal: DashboardListRow) => void;
    handleImport?: (deal: DashboardListRow) => void;
    handlePay?: (deal: DashboardListRow) => void;
    handleBulkUpdate?: () => void;
    
    customFilter?: React.ReactNode; 
    onAddLedgerClick?: () => void; 
    
    extraButtons?: React.ReactNode;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    idField?: string;
    bulkUpdateFields?: BulkUpdateField[];
    onBulkUpdateSave?: (field: string, value: any, ids: (string | number)[]) => Promise<void>;
    
    // RBAC
    mainModule?: string;
    subModule?: string;
    onSuccess?: () => void;
    getRowClass?: (deal: DashboardListRow) => string;
    onBulkUpload?: (data: any[]) => Promise<void>;
}
const ListComponent = ({
    title,
    customFilter,
    handleShow,
    loading,
    extraButtons,
    periodOptions,
    tableHeaders,
    dealsData,
    customCellRenderer,
    linkField,
    linkRoute,
    statusField,
    periodField,
    showTotal = true,
    onAddLedgerClick,
    onAddClick,
    handleEdit,
    handleDelete,
    appliedFilters,
    handleView,
    handleSummary,
    handleImport,
    handlePay,
    handleBulkUpdate,
    selectedIds = [],
    onSelectionChange,
    idField = "ID",
    bulkUpdateFields,
    onBulkUpdateSave,
    mainModule = "",
    subModule = "",
    onSuccess,
    getRowClass,
    onBulkUpload,
}: DashboardListProps) => {
    const isBlocked = (value: any) =>
        value === "Yes" ||
        value === "Blocked" ||
        value === "1" ||
        value === 1 ||
        String(value).toLowerCase() === "true" ||
        String(value).toLowerCase() === "yes" ||
        String(value).toLowerCase() === "blocked";

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({
        senderName: "",
        senderEmail: "",
        ccEmail: ""
    });
    const [isSending, setIsSending] = useState(false);

    const showToast = useToast();
    const canBulkUpdate = mainModule && subModule ? hasPermission(mainModule, subModule, "Updated") : true;

    const location = useLocation();
    const storageKey = `currentPage_${title.replace(/\s+/g, "_")}`;
    const itemsPerPageStorageKey = `itemsPerPage_${title.replace(/\s+/g, "_")}`;

    const [currentPage, setCurrentPage] = useState<number>(() => {
        const lastPath = sessionStorage.getItem("lastPathname");
        const currentPath = location.pathname;
        const saved = sessionStorage.getItem(storageKey);
        const resolved = (lastPath === currentPath && saved) ? Number(saved) : 1;
        console.log(`[PAGINATION DEBUG] Init currentPage for "${title}":`, {
            lastPath,
            currentPath,
            saved,
            resolved
        });
        return resolved;
    });

    const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
        const lastPath = sessionStorage.getItem("lastPathname");
        const currentPath = location.pathname;
        const saved = sessionStorage.getItem(itemsPerPageStorageKey);
        const resolved = (lastPath === currentPath && saved) ? Number(saved) : 10;
        console.log(`[PAGINATION DEBUG] Init itemsPerPage for "${title}":`, {
            lastPath,
            currentPath,
            saved,
            resolved
        });
        return resolved;
    });

    // Save pathname and state changes to sessionStorage
    useEffect(() => {
        console.log(`[PAGINATION DEBUG] Saving lastPathname: ${location.pathname}`);
        sessionStorage.setItem("lastPathname", location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        console.log(`[PAGINATION DEBUG] Saving currentPage: ${currentPage} for "${title}"`);
        sessionStorage.setItem(storageKey, String(currentPage));
    }, [currentPage, storageKey, title]);

    useEffect(() => {
        console.log(`[PAGINATION DEBUG] Saving itemsPerPage: ${itemsPerPage} for "${title}"`);
        sessionStorage.setItem(itemsPerPageStorageKey, String(itemsPerPage));
    }, [itemsPerPage, itemsPerPageStorageKey, title]);

    const [searchText, setSearchText] = useState("");

    const [filteredDeals, setFilteredDeals] = useState(dealsData);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
        null
    );
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [bulkField, setBulkField] = useState<string>("");
    const [bulkValue, setBulkValue] = useState<string>("");
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [selectedPeriod] = useState<string>(
        periodOptions[0]
    );

    const prevSearchText = useRef(searchText);
    const prevSelectedPeriod = useRef(selectedPeriod);
    const prevPeriodField = useRef(periodField);

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

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            const lowercasedSearchText = searchText.toLowerCase();

            const newFilteredDeals = dealsData.filter((deal) => {
                const matchesSearchText = Object.values(deal).some(
                    (value) =>
                        value && String(value).toLowerCase().includes(lowercasedSearchText)
                );
                const matchesPeriod =
                    selectedPeriod === "All" ||
                    (periodField && String(deal[periodField]) === selectedPeriod);
                return matchesSearchText && matchesPeriod;
            });

            const searchOrPeriodChanged =
                prevSearchText.current !== searchText ||
                prevSelectedPeriod.current !== selectedPeriod ||
                prevPeriodField.current !== periodField;

            setFilteredDeals(newFilteredDeals);

            console.log(`[PAGINATION DEBUG] Timeout run for "${title}":`, {
                searchOrPeriodChanged,
                prevSearchText: prevSearchText.current,
                searchText,
                prevSelectedPeriod: prevSelectedPeriod.current,
                selectedPeriod,
                prevPeriodField: prevPeriodField.current,
                periodField,
                filteredCount: newFilteredDeals.length,
                itemsPerPage,
                newTotalPages: Math.ceil(newFilteredDeals.length / itemsPerPage),
                currentPage
            });

            if (searchOrPeriodChanged) {
                console.log(`[PAGINATION DEBUG] Resetting page to 1 due to search/period change`);
                setCurrentPage(1);
            } else {
                const newTotalPages = Math.ceil(newFilteredDeals.length / itemsPerPage);
                setCurrentPage((prev) => {
                    const nextPage = Math.max(1, Math.min(prev, newTotalPages || 1));
                    console.log(`[PAGINATION DEBUG] Clamped currentPage for "${title}":`, {
                        prev,
                        nextPage,
                        newTotalPages
                    });
                    return nextPage;
                });
            }

            prevSearchText.current = searchText;
            prevSelectedPeriod.current = selectedPeriod;
            prevPeriodField.current = periodField;
        }, 300);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [searchText, dealsData, selectedPeriod, periodField, itemsPerPage, title]);

    useEffect(() => {
        if (bulkUpdateFields && bulkUpdateFields.length > 0 && !bulkField) {
            setBulkField(bulkUpdateFields[0].key);
        }
    }, [bulkUpdateFields, bulkField]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };
    
    const sortedDeals = [...filteredDeals].sort((a, b) => {
        if (!sortKey) return 0;

        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (aValue === null || aValue === undefined)
            return sortDirection === "asc" ? 1 : -1;
        if (bValue === null || bValue === undefined)
            return sortDirection === "asc" ? -1 : 1;
        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortDirection === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });

    const getStatusBadgeColor = (status: string) => {
        return status === "Won" ? "bg-success" : "bg-danger";
    };

    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDeals.length);
    const currentDeals = sortedDeals.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            const allIds = currentDeals.map((deal) => deal[idField] as string | number);
            const newSelection = Array.from(new Set([...selectedIds, ...allIds]));
            onSelectionChange(newSelection);
        } else {
            const currentIds = currentDeals.map((deal) => deal[idField] as string | number);
            const newSelection = selectedIds.filter((id) => !currentIds.includes(id));
            onSelectionChange(newSelection);
        }
    };

    const handleRowSelect = (id: string | number, checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter((sid) => sid !== id));
        }
    };

    const isAllSelected = currentDeals.length > 0 && currentDeals.every((deal) => selectedIds.includes(deal[idField] as string | number));
    const isSomeSelected = currentDeals.some((deal) => selectedIds.includes(deal[idField] as string | number)) && !isAllSelected;

    const handleInternalBulkUpdate = () => {
        if (selectedIds.length === 0) {
            alert("Please select rows to update.");
            return;
        }
        
        // Update bulkValue with existing value of the first selected item
        const firstId = selectedIds[0];
        const firstItem = dealsData.find(m => m[idField] === firstId);
        if (firstItem && bulkField) {
            setBulkValue(String(firstItem[bulkField] || ""));
        }
        
        
        setShowBulkUpdateModal(true);
    };

    const handleInternalBulkSave = async () => {
        if (!onBulkUpdateSave) return;
        if (!bulkValue) {
            alert("Please enter a new value.");
            return;
        }

        try {
            setIsBulkLoading(true);
            await onBulkUpdateSave(bulkField, bulkValue, selectedIds);
            onSuccess?.();
            setShowBulkUpdateModal(false);
            if (onSelectionChange) onSelectionChange([]);
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleExportPdf = () => {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ✅ GET COMPANY NAME DYNAMICALLY
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

    // ================= HEADER =================
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(companyName, pageWidth / 2, 10, { align: "center" });

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    let startY = 16;

    // ================= FILTER INFO =================
    // ================= FILTER INFO =================
const filters: string[] = [];

// 🔹 Search filter
if (searchText) filters.push(`Search: ${searchText}`);

// 🔹 Period filter
if (selectedPeriod && selectedPeriod !== "All")
    filters.push(`Period: ${selectedPeriod}`);

// 🔹 Parent applied filters
if (appliedFilters) {
    Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) filters.push(`${key}: ${value}`);
    });
}

if (filters.length > 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Filters Applied:", 14, startY);
    doc.setFont(undefined, "normal");

    startY += 5;

    // Auto wrap long filter line
    const splitText = doc.splitTextToSize(
        filters.join(" | "),
        pageWidth - 20
    );

    doc.text(splitText, 14, startY);
    startY += splitText.length * 5;
}
    // ================= REMOVE BLOCKED + IMAGE =================
    const exportHeaders = tableHeaders.filter(
    (header) =>
        header.key !== "Blocked" &&
        header.key !== "__image" 
);

const rows = sortedDeals
    .filter((deal) => !isBlocked(deal.Blocked))
    .map((deal, index) =>
  exportHeaders.map((header) => {

    // ✅ ADD S.NO
    if (header.dataType === "index") {
      return index + 1;
    }

    const value = deal[header.key];

    if (header.dataType === "number") {
      let num = Number(String(value ?? 0).replace(/,/g, ""));
      if (["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(header.key)) {
        num = num / 1000;
      }
      return isNaN(num) ? "" : num.toFixed(2);
    }

    return value ?? "";
  })
);

    // ================= TABLE =================
    autoTable(doc, {
        startY: startY,
        head: [exportHeaders.map((h) => h.label)],
        body: rows,

        theme: "grid",

        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
            cellWidth: "auto",
        },

        headStyles: {
            fillColor: [0, 0, 0],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
        },

        tableWidth: "auto",
        margin: { left: 8, right: 8 },

        didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.text(
                `Page ${data.pageNumber}`,
                pageWidth - 20,
                pageHeight - 5
            );
        },
    });

        doc.save(`${title}.pdf`);
    };

    const handleMailPdf = () => {
        setShowEmailModal(true);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        showToast("Info", "Generating PDF and sending email...", "info");

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
        if (selectedPeriod && selectedPeriod !== "All") filters.push(`Period: ${selectedPeriod}`);
        if (appliedFilters) {
            Object.entries(appliedFilters).forEach(([key, value]) => {
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
            .filter((deal) => !isBlocked(deal.Blocked))
            .map((deal, index) =>
            exportHeaders.map((header) => {
                if (header.dataType === "index" || header.key === "sno") return index + 1;
                const value = deal[header.key];
                if (header.dataType === "number") {
                    let num = Number(String(value ?? 0).replace(/,/g, ""));
                    if (["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(header.key)) {
                        num = num / 1000;
                    }
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

        const base64Content = doc.output('datauristring').split(',')[1];
        const fileName = `${title}.pdf`;
        const mailUrl = "https://norissolutions.in/SendMail/MailAttachment.php";
        
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
        const exportHeaders = tableHeaders.filter(
            (header) =>
                header.key !== "Blocked" &&
                header.key !== "__image"
        );

        const exportData = filteredDeals
            .filter((deal) => !isBlocked(deal.Blocked))
            .map((deal, index) => {
            const obj: Record<string, string | number> = {};

            exportHeaders.forEach((h) => {
                const value = (h.key === "sno" || h.dataType === "index") ? index + 1 : deal[h.key];

                if (h.dataType === "number") {
                    let num = Number(String(value ?? 0).replace(/,/g, ""));
                    if (["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(h.key)) {
                        num = num / 1000;
                    }
                    obj[h.label] = isNaN(num)
                        ? ""
                        : Number(num.toFixed(2)); // ✅ max 2 decimals
                } else {
                    obj[h.label] = value ?? "";
                }
            });

            return obj;
        });

        if (showTotal) {
            const totalsRow: Record<string, string | number> = {};
            exportHeaders.forEach((h, i) => {
                totalsRow[h.label] = i === 0 ? "Total" : (totals[h.key] || "");
            });
            exportData.push(totalsRow);
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(
            new Blob([excelBuffer], { type: "application/octet-stream" }),
            `${title}.xlsx`
        );
    };

    const handleResetSearch = () => {
        setSearchText("");
    };

    const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ================= TOTAL CALCULATION =================
const totals: Record<string, string> = {};

tableHeaders.forEach((header) => {
  if (header.dataType !== "number" || header.showTotal === false) {
    totals[header.key] = "";
    return;
  }

  let sum = 0;

  filteredDeals.forEach((deal) => {
    if (isBlocked(deal.Blocked)) return; // Skip blocked rows for totals
    const raw = deal[header.key];
    const num = Number(String(raw ?? 0).replace(/,/g, ""));
    if (!isNaN(num)) sum += num;
  });

  if (["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(header.key)) {
    totals[header.key] = indianNumberFormatter.format(sum / 1000);
  } else {
    totals[header.key] = indianNumberFormatter.format(sum);
  }
});




    return (
        <div className="d-flex flex-column">
            {/* Toolbar */}
           <div
  className="card shadow-sm rounded-3 m-1">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        {/* Search + Filter */}
                        {/* Search OR Page-Specific Filter */}
{/* LEFT : Search / Filter */}
<div className="col-12 col-md-8">

  {customFilter ? (
    <div className="w-100">{customFilter}</div>
  ) : (
    <div className="d-flex align-items-center gap-2">
      <div className="position-relative" style={{ width: "250px" }}>
        <input
          type="text"
          className="form-control ps-5 pe-5 rounded"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
        {searchText && (
          <button
            type="button"
            className="btn btn-sm border-0 bg-transparent position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={handleResetSearch}
          >
            <i className="bi bi-x-lg text-primary"></i>
          </button>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
  {handleShow && (
    <Button
      variant="primary"
      onClick={handleShow}
      className="d-flex align-items-center justify-content-center"
      style={{ width: "40px", height: "40px", borderRadius: "50%" }}
    >
      <i className="bi bi-funnel-fill"></i>
    </Button>
  )}

  {extraButtons && extraButtons} {/* ✅ CUSTOM BUTTON */}
</div>

    </div>
  )}
</div>


                        {/* Right Side Controls */}
                        {/* RIGHT : Buttons */}
<div className="col-12 col-md-4 d-flex justify-content-end align-items-center gap-2">

                            


                            {handleSummary && (
                                <button
                                    className="btn btn-outline-primary shadow d-flex align-items-center"
                                    onClick={handleSummary}
                                >
                                    Summary
                                </button>
                            )}
                            {handleImport && (
                                <button
                                    className="btn btn-outline-primary shadow d-flex align-items-center"
                                    onClick={handleImport}
                                >
                                    Import
                                </button>
                            )}
                            {/* Export Excel */}
                            <button
                                className="btn btn-outline-primary shadow d-flex align-items-center gap-2"
                                onClick={handleExportExcel}
                            >
                                <i className="ti ti-file-spreadsheet fs-4"></i>
                            </button>

                            {/* Export PDF */}
                            <button
                                className="btn btn-outline-primary shadow d-flex align-items-center gap-1"
                                onClick={handleExportPdf}
                                title="Download PDF"
                            >
                                <i className="ti ti-file-type-pdf fs-4"></i>
                            </button>

                            {/* Send Mail */}
                            <button
                                className="btn btn-outline-primary shadow d-flex align-items-center gap-1"
                                onClick={handleMailPdf}
                                title="Send Mail"
                            >
                                <i className="ti ti-mail fs-4"></i>
                            </button>

                            {/* Bulk Upload Excel */}
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

                            {/* Add Button */}
                            
                          {/* Add Ledger Button */}


{/* Existing Add Button */}
{onAddClick && (
  <button
    onClick={onAddClick}
    className="btn btn-secondary shadow d-flex align-items-center"
    style={{
      backgroundColor: "#ffab2deb",
      borderColor: "#ffab2deb",
      color: "#fff",
      padding: "9px 10px",        // 🔽 smaller size
      fontSize: "15px",
      lineHeight: "1.2",
      boxShadow: "none",
      transition: "none",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#ffab2deb";
      e.currentTarget.style.borderColor = "#ffab2deb";
      e.currentTarget.style.color = "#fff";
      e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#ffab2deb";
      e.currentTarget.style.borderColor = "#ffab2deb";
      e.currentTarget.style.color = "#fff";
      e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
    }}
  >
    <i className="bi bi-plus-lg me-1"></i> Add
  </button>
)}

{handleBulkUpdate && canBulkUpdate && (
  <button
    onClick={handleBulkUpdate}
    className="btn d-flex align-items-center"
    style={{
      backgroundColor: "#198754",
      borderColor: "#198754",
      color: "#fff",
      padding: "9px 10px",
      fontSize: "15px",
      lineHeight: "1.2",
      boxShadow: "none",
      transition: "none",
    }}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.backgroundColor = "#157347";
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.backgroundColor = "#198754";
    }}
  >
    <i className="bi bi-pencil-square me-1"></i> Bulk Update
  </button>
)}

{onBulkUpdateSave && bulkUpdateFields && selectedIds.length > 0 && canBulkUpdate && (
  <button
    onClick={handleInternalBulkUpdate}
    className="btn d-flex align-items-center"
    style={{
      backgroundColor: "#198754",
      borderColor: "#198754",
      color: "#fff",
      padding: "9px 10px",
      fontSize: "15px",
      lineHeight: "1.2",
      boxShadow: "none",
      transition: "none",
    }}
    onMouseEnter={(e: any) => {
      e.currentTarget.style.backgroundColor = "#157347";
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.backgroundColor = "#198754";
    }}
  >
    <i className="bi bi-pencil-square me-1"></i> Bulk Update
  </button>
)}

{onAddLedgerClick && (
  <button
    onClick={onAddLedgerClick}
    className="btn d-flex align-items-center"
    style={{
      backgroundColor: "#dc3545", // bootstrap danger
      borderColor: "#dc3545",
      color: "#fff",
      padding: "10x 10px",        // 🔽 smaller size
      fontSize: "15px",
      lineHeight: "1.2",
      boxShadow: "none",
      transition: "none",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#dc3545";
      e.currentTarget.style.borderColor = "#dc3545";
      e.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#dc3545";
      e.currentTarget.style.borderColor = "#dc3545";
      e.currentTarget.style.color = "#fff";
    }}
  >
    <i className="bi bi-plus-lg me-1" style={{ fontSize: "12px" }}></i>
    Add Ledger
  </button>
)}




                        </div>
                    </div>
                </div>
            </div>

            {/* Applied Filters Display */}
            {appliedFilters && Object.values(appliedFilters).some(v => v !== "" && v !== null && v !== undefined) && (
                <div className="mx-1 mb-2 d-flex align-items-center flex-wrap gap-2 px-2 py-2 bg-light rounded shadow-sm border border-secondary border-opacity-10">
                    <span className="text-muted fw-bold small me-1">
                        <i className="bi bi-funnel text-primary me-1"></i>Applied Filters:
                    </span>
                    {(() => {
                        const chips = [];
                        const processedKeys = new Set();
                        const filterObj = appliedFilters as Record<string, any>;

                        // 1. Handle Date Range (FromDate + ToDate)
                        if (filterObj.FromDate && filterObj.ToDate) {
                            chips.push(
                                <div key="date-range" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar3 text-primary me-2"></i>
                                    Date: <span className="text-primary ms-1">{filterObj.FromDate}</span> <span className="mx-2 text-muted">to</span> <span className="text-primary">{filterObj.ToDate}</span>
                                </div>
                            );
                            processedKeys.add("FromDate");
                            processedKeys.add("ToDate");
                        } else if (filterObj.FromDate) {
                            chips.push(
                                <div key="from-date" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    From: <span className="text-primary ms-1">{filterObj.FromDate}</span>
                                </div>
                            );
                            processedKeys.add("FromDate");
                        } else if (filterObj.ToDate) {
                            chips.push(
                                <div key="to-date" className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    To: <span className="text-primary ms-1">{filterObj.ToDate}</span>
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

            {/* Table */}
            <div className="card rounded-3 m-1">
                <div className="card-body p-0">
                    <div className="table-responsive" style={{
    overflow: "auto",
    overflowX: "auto",
    maxHeight: "none",
    height: "auto",
  }}>
                        <table className="table table-hover align-middle text-nowrap">
                            <thead className="table-light">
                                <tr>
                                    {onSelectionChange && (
                                        <th className="bg-primary bg-opacity-10 text-center" style={{ width: "40px" }}>
                                            <div className="form-check d-flex justify-content-center m-0">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isSomeSelected;
                                                    }}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </div>
                                        </th>
                                    )}
                                    {tableHeaders.map((header, index) => {
                                        const alignmentClass = 
                                            header.align ? `text-${header.align}` :
                                            header.dataType === "number" ? "text-end" : "text-start";
                                        return (
                                            <th
                                                key={index}
                                                className={`bg-primary bg-opacity-10 text-primary cursor-pointer`}
                                                onClick={() => handleSort(header.key)}
                                            >
                                                <div className={`${alignmentClass}`}>
                                                    <span>{header.label}</span>
                                                    {sortKey === header.key && (
                                                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}

                                    {(handleEdit || handleDelete) && (
                                        <th className="bg-primary bg-opacity-10 text-primary text-center">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <style>
                                {`
                                    @media print {
                                        tr[class*="blocked-row"],
                                        tr[style*="not-allowed"] {
                                            display: none !important;
                                        }
                                    }
                                `}
                            </style>
                            {loading ? (
                                <TableSkeleton
                                    columns={tableHeaders.length}
                                    showActions={Boolean(handleEdit || handleDelete)}
                                />
                            ) : (
                                <tbody>
                                    {currentDeals.length > 0 ? (
                                        currentDeals.map((deal, index) => (
                                            <tr
  key={index}
  className={getRowClass ? getRowClass(deal) : (deal.PrimaryAcc === "Yes" ? "table-success" : "bg-white")}
>

                                                {onSelectionChange && (
                                                    <td className="text-center">
                                                        <div className="form-check d-flex justify-content-center m-0">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={selectedIds.includes(deal[idField] as string | number)}
                                                                onChange={(e) => handleRowSelect(deal[idField] as string | number, e.target.checked)}
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                                {tableHeaders.map((header, i) => {
                                                    let value: any = deal[header.key];

// ✅ AUTO S.No (pagination-safe)
if (header.dataType === "index") {
  value = startIndex + index + 1;
}

// ✅ NUMBER FORMATTING
// ✅ NUMBER FORMATTING (2 decimals where required)
if (header.dataType === "number") {
  const num = Number(String(value ?? 0).replace(/,/g, ""));

  // Columns that MUST show 2 decimals
  const twoDecimalColumns = [
  "Rate",
  "Amount",
  "Stock",
  "Issued",
  "Issed",
  "Balance",
  "SUM(Debited)",
  "SUM(Credited)",
  "SUM(GrandTotal)",
  "DebitAmount",
  "Payable",
  "Paid",
  "SUM(GSTAmount)",
  "SUM(Total)",
  "SUM(Amount)",
];

  if (["Rate", "Amount","Receipts","Payments","Balance"].includes(header.key)) {
  value = `₹ ${indianNumberFormatter.format(num)}`;
} else if (twoDecimalColumns.includes(header.key)) {
  value = indianNumberFormatter.format(num);
} else {
  value = num;
}// Qty For Rate,amunt only rupee symbol if any value needed rupee symbol add here 
}


// ✅ ALIGNMENT
const alignmentClass =
  header.align ? `text-${header.align}` :
  header.dataType === "number" 
    ? "text-end"
    : "text-start";
                                                    return (
                                                        <td key={i} className={`py-3 ${alignmentClass}`}>
                                                            {linkField && header.key === linkField ? (
                                                                <Link
                                                                    to={linkRoute || "#"}
                                                                    className="text-primary text-decoration-none"
                                                                >
                                                                    {value}
                                                                </Link>
                                                            ) : statusField && header.key === statusField ? (
                                                                <span
                                                                    className={`badge rounded-pill px-3 py-2 ${getStatusBadgeColor(
                                                                        String(value)
                                                                    )}`}
                                                                >
                                                                    {value}
                                                                </span>
                                                            ) : (
                                                                header.dataType === "number" && ["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(header.key)
                                                                    ? <span className="fw-semibold text-end">{indianNumberFormatter.format(Number(String(value ?? 0).replace(/,/g, "")) / 1000)}</span>
                                                                    : <span className="text-dark">{value}</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {(handleEdit || handleDelete) && (
                                                    <td className="text-center py-3">
                                                        <div className="dropdown table-action">
                                                            <button
                                                                type="button"
                                                                className="action-icon btn btn-xs shadow btn-icon btn-outline-light"
                                                                data-bs-toggle="dropdown"
                                                            >
                                                                <i className="ti ti-dots-vertical"></i>
                                                            </button>

                                                            <div className="dropdown-menu dropdown-menu-end">
                                                                {handlePay && (
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item d-flex align-items-center"
                                                                        onClick={() => handlePay(deal)}
                                                                    >
                                                                        <i className="ti ti-cash me-2 text-primary"></i>
                                                                        Advance / Pay
                                                                    </button>
                                                                )}

                                                                {handleEdit && (
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item d-flex align-items-center"
                                                                        onClick={() => handleEdit(deal)}
                                                                    >
                                                                        <i className="ti ti-edit me-2 text-primary"></i>
                                                                        Edit
                                                                    </button>
                                                                )}

                                                                {handleDelete && (
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item d-flex align-items-center"
                                                                        onClick={() => handleDelete(deal)}
                                                                    >
                                                                        <i className="ti ti-trash me-2 text-primary"></i>
                                                                        Delete
                                                                    </button>
                                                                )}
                                                                {handleView && (
                                                                    <button
                                                                        type="button"
                                                                        className="dropdown-item d-flex align-items-center"
                                                                        onClick={() => handleView(deal)}
                                                                    >
                                                                        <i className="ti ti-eye me-2 text-primary"></i>
                                                                         View
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeaders.length + 1} className="text-center py-5">
                                                <i className="bi bi-search display-6 text-muted d-block mb-2"></i>
                                                <span className="text-muted">No data available</span>
                                            </td>
                                        </tr>
                                    )}
                                    {/* ================= TOTAL ROW ================= */}
{showTotal && (
  <tr className="table-light fw-bold">
    {onSelectionChange && <td></td>}
    {tableHeaders.map((header, i) => {
      if (i === 0) {
        return (
          <td key={i} className="text-start">
            Total
          </td>
        );
      }

      const alignmentClass =
        header.dataType === "number" ? "text-end" : "text-start";

      return (
        <td key={i} className={alignmentClass}>
          {totals[header.key] ?? ""}
        </td>
      );
    })}

    {(handleEdit || handleDelete) && <td></td>}
  </tr>
)}


                                </tbody>
                            )}
                        </table>


                    </div>
                </div>

                {/* ✅ Pagination with rows per page + record info */}
                {filteredDeals.length > 0 && (
                    <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                className="form-select form-select-sm w-auto"
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
                            <span className="ms-2 text-muted">
                                Showing {startIndex + 1}–{endIndex} of {filteredDeals.length}{" "}
                                records
                            </span>
                        </div>
                        {totalPages > 1 && (
                            <nav>
                                <ul className="pagination flex-wrap mb-0">
                                    {/* Previous */}
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>

                                    {/* First page */}
                                    <li className={`page-item ${currentPage === 1 ? "active" : ""}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(1)}>
                                            1
                                        </button>
                                    </li>

                                    {/* Left ellipsis */}
                                    {currentPage > 3 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">...</span>
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
                                                <button className="page-link" onClick={() => setCurrentPage(page)}>
                                                    {page}
                                                </button>
                                            </li>
                                        ))}

                                    {/* Right ellipsis */}
                                    {currentPage < totalPages - 2 && (
                                        <li className="page-item disabled">
                                            <span className="page-link">...</span>
                                        </li>
                                    )}

                                    {/* Last page */}
                                    {totalPages > 1 && (
                                        <li
                                            className={`page-item ${currentPage === totalPages ? "active" : ""
                                                }`}
                                        >
                                            <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                                                {totalPages}
                                            </button>
                                        </li>
                                    )}

                                    {/* Next */}
                                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={handleNextPage}
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

            {/* Bulk Update Offcanvas */}
            <Offcanvas
                show={showBulkUpdateModal}
                onHide={() => setShowBulkUpdateModal(false)}
                placement="end"
                style={{ width: "400px" }}
            >
                <Offcanvas.Header closeButton>
                    <div>
                        <h5 className="mb-0 text-primary">Bulk Update</h5>
                        <small className="text-muted">Update {selectedIds.length} selected records</small>
                    </div>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {isBulkLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">Applying changes to {selectedIds.length} records...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Field to Update</label>
                                <select 
                                    className="form-select" 
                                    value={bulkField} 
                                    onChange={(e) => {
                                        const field = e.target.value;
                                        setBulkField(field);
                                        // Update bulkValue with existing value of the first selected item
                                        const firstId = selectedIds[0];
                                        const firstItem = dealsData.find(m => m[idField] === firstId);
                                        if (firstItem) {
                                            setBulkValue(String(firstItem[field] || ""));
                                        }
                                    }}
                                >
                                    {bulkUpdateFields?.map((f) => (
                                        <option key={f.key} value={f.key}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Existing Value (Reference)</label>
                                <input 
                                    type="text" 
                                    className="form-control bg-light" 
                                    value={String(dealsData.find(m => m[idField] === selectedIds[0])?.[bulkField] || "")} 
                                    disabled 
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">New Value</label>
                                {bulkUpdateFields?.find(f => f.key === bulkField)?.type === "date" ? (
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={bulkValue} 
                                        onChange={(e) => setBulkValue(e.target.value)}
                                    />
                                ) : (
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={bulkValue} 
                                        onChange={(e) => setBulkValue(e.target.value)}
                                        placeholder={`Enter new value`}
                                    />
                                )}
                            </div>

                            <div className="d-grid gap-2 mt-4">
                                <button className="btn btn-primary" onClick={handleInternalBulkSave}>
                                    Save Changes
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => setShowBulkUpdateModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </Offcanvas.Body>
            </Offcanvas>

             {/* 🔽 ADD MODAL HERE */}
            {/* {showAddModal && (
              <div
                className="modal fade show d-block"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">

                    <div className="modal-header">
                      <h5 className="modal-title">Add Compressor Entry</h5>
                      <button
                        className="btn-close"
                        onClick={() => setShowAddModal(false)}
                      />
                    </div>

                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input className="form-control" placeholder="Compressor" />
                        </div>
                        <div className="col-md-6">
                          <input className="form-control" placeholder="Quarry" />
                        </div>
                        <div className="col-md-6">
                          <input type="date" className="form-control" />
                        </div>
                        
                        <div className="col-md-6">
                          <input className="form-control" placeholder="Rate" />
                        </div>
                        <div className="col-md-6">
                          <input className="form-control" placeholder="Total Holes" />
                        </div>
                        <div className="col-md-6">
                          <input className="form-control" placeholder="Amount" />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowAddModal(false)}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-danger">
                        Save
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )} */}
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
                        <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSending}>
                            {isSending ? "Sending..." : "Send Email"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </div>
    );
};

export default ListComponent;
