import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
    title: string;
    handleShow?: (deal: DashboardListRow) => void;
    periodOptions: string[];
    tableHeaders: TableHeader[];
    dealsData: DashboardListRow[];
    linkField?: string;
    linkRoute?: string;
    showControls?: boolean;
    statusField?: string;
    appliedFilters?: any;
    customFilter?: React.ReactNode;
    periodField?: string;
    onAddLedgerClick?: () => void;
    handleLine?: (deal: DashboardListRow) => void;
    handleSummary?: (deal: DashboardListRow) => void;
    handleEdit?: (deal: DashboardListRow) => void;
    handleDelete?: (deal: DashboardListRow) => void;
    onMaterialClick?: (deal: DashboardListRow) => void;
    onTransportClick?: (deal: DashboardListRow) => void;

    renderRowActions?: (deal: DashboardListRow) => React.ReactNode;
    handleView?: (deal: DashboardListRow) => void;

    // --- Bulk Update Props ---
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    bulkUpdateFields?: { label: string; key: string; type?: "text" | "date" | "number" }[];
    onBulkUpdateSave?: (field: string, value: any, ids: (string | number)[]) => Promise<void>;
    handleImport?: () => void;
    rowClassName?: (deal: DashboardListRow) => string;
    onSuccess?: () => void;
    onBulkUpload?: (data: any[]) => Promise<void>;
    onAddClick?: () => void;
    addClickText?: string;
}



const isBlocked = (value: any) =>
    value === "Yes" ||
    value === "Blocked" ||
    value === "1" ||
    value === 1 ||
    String(value).toLowerCase() === "true";

const formatBlockedText = (value: any) =>
    isBlocked(value) ? "Blocked" : "Unblocked";


const ProductionList = ({
    title,
    handleShow,
    periodOptions,
    tableHeaders,
    dealsData,
    linkField,
    linkRoute,
    statusField,
    appliedFilters,
    periodField,
    onAddLedgerClick,
    handleSummary,
    handleLine,
    customFilter,
    handleEdit,
    handleImport,
    onMaterialClick,
    onTransportClick,
    handleView,
    renderRowActions,
    showControls = true,
    handleDelete,
    selectedIds = [],
    onSelectionChange,
    bulkUpdateFields,
    onBulkUpdateSave,
    rowClassName,
    onSuccess,
    onBulkUpload,
    onAddClick,
    addClickText,
}: DashboardListProps) => {
    const showToast = useToast();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [searchText, setSearchText] = useState("");
    const [filteredDeals, setFilteredDeals] = useState(dealsData);

    const toggleBlockedStatus = (deal: any) => {
        const nextValue: 0 | 1 = isBlocked(deal.Blocked) ? 0 : 1;
        updateSalesBlock(deal, nextValue);
    };


    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string>(periodOptions[0]);

    const prevSearchText = useRef(searchText);
    const prevSelectedPeriod = useRef(selectedPeriod);
    const prevPeriodField = useRef(periodField);
    const [showMaterialCanvas, setShowMaterialCanvas] = useState(false);
    const [selectedParty, setSelectedParty] = useState<string>("");

    const [materialRows, setMaterialRows] = useState<any[]>([]);
    const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

    // --- Bulk Update Internal State ---
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
        if (showAddMaterialModal) {
            fetchMaterialMaster();
        }
    }, [showAddMaterialModal]);
    const [showImageCanvas, setShowImageCanvas] = useState(false);

    const [imageList, setImageList] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);

    const fetchSalesImages = async (row: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !row?.ID) return;

            setImageLoading(true);          // ✅ START LOADING
            setImageList([]);               // ✅ CLEAR OLD IMAGES
            setShowImageCanvas(true);       // ✅ OPEN OFFCANVAS IMMEDIATELY

            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=GetSalesImages`,
                {
                    IDS: row.ID,
                    Typed: row.Typed,
                }
            );

            const images: string[] = [];

            if (Array.isArray(res.data)) {
                res.data.forEach((item: any) => {
                    Object.keys(item).forEach((key) => {
                        if (key.startsWith("Image") && typeof item[key] === "string") {
                            let base64 = item[key]
                                .replace(/^data:image\/\w+;base64,/, "")
                                .replace(/[\r\n\s]+/g, "");

                            const padding = base64.length % 4;
                            if (padding !== 0) {
                                base64 += "=".repeat(4 - padding);
                            }

                            images.push(base64);
                        }
                    });
                });
            }

            setImageList(images);
        } catch (err) {
            console.error("Image fetch error", err);
            setImageList([]);
        } finally {
            setImageLoading(false);         // ✅ STOP LOADING
        }
    };

    const updateSalesBlock = async (row: any, blockValue: 0 | 1) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !row?.ID) return;

            await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=GetSalesBlock`,
                {
                    IDS: row.ID,
                    Typed: row.Typed, // 1 = Block, 0 = Unblock
                }
            );

            // 🔁 Update UI immediately
            setFilteredDeals((prev) =>
                prev.map((d) =>
                    d.ID === row.ID ? { ...d, Blocked: blockValue } : d
                )
            );
            onSuccess?.();
        } catch (error) {
            console.error("Block/Unblock failed", error);
            alert("Failed to update block status");
        }
    };

    const [newMaterial, setNewMaterial] = useState({
        Material: "",
        Measurement: "",
        Units: "",
        Rate: "",
    });
    const [materialMaster, setMaterialMaster] = useState<string[]>([]);
    useEffect(() => {
        if (title === "Sales" || title === "Debitors") {
            fetchMaterialMaster();
        }
    }, [title]);
    const fetchMaterials = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !selectedRow?.Party) {
                setMaterialRows([]);
                return;
            }

            const response = await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyMaterials`,
                {
                    Party: selectedRow.Party,
                }
            );

            setMaterialRows(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Material API Error:", error);
            setMaterialRows([]);
        }
    };


    const fetchTransports = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !selectedRow?.Party) {
                setTransportRows([]);
                return;
            }

            const response = await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyTransport`,
                {
                    Party: selectedRow.Party,
                }
            );

            setTransportRows(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Transport API Error:", error);
            setTransportRows([]);
        }
    };


    const fetchMaterialMaster = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) return;

            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
            );

            let materials: string[] = [];

            if (Array.isArray(res.data)) {
                materials = res.data.map((item: any) => item.Material || "");
            }

            setMaterialMaster(materials);
        } catch (error) {
            console.error("Material master fetch failed:", error);
            setMaterialMaster([]);
        }
    };

    const [showViewCanvas, setShowViewCanvas] = useState(false);
    const [viewFilter, setViewFilter] = useState({
        Party: "",
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });

    const [viewData, setViewData] = useState<any[]>([]);
    const [viewLoading, setViewLoading] = useState(false);

    const [showTransportCanvas, setShowTransportCanvas] = useState(false);
    const [showAddTransportModal, setShowAddTransportModal] = useState(false);
    const [transporters, setTransporters] = useState<any[]>([]);

    useEffect(() => {
        if (!showAddTransportModal) return;

        const fetchTransporters = async () => {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";

                const res = await axios.get(
                    `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
                );

                const activeTransporters = (res.data || []).filter(
                    (l: any) => l.Type === "Transport"
                );

                setTransporters(activeTransporters);
            } catch (err) {
                console.error("Failed to load transporters", err);
                setTransporters([]);
            }
        };

        fetchTransporters();
    }, [showAddTransportModal]);

    const transporterOptions = transporters.map((t) => ({
        value: t.Party,
        label: t.Party,
    }));

    const [newTransport, setNewTransport] = useState<{
        Transporter: string | string[];
        Destination: string;
        Rate: string;
        Measurement: string;
    }>({
        Transporter: "",
        Destination: "",
        Rate: "",
        Measurement: "",
    });

    const [selectedRow, setSelectedRow] = useState<DashboardListRow | null>(null);
    const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);

    const [materialMode, setMaterialMode] = useState<"add" | "edit">("add");
    const [editingMaterialRow, setEditingMaterialRow] = useState<any>(null);
    const [isEditMaterial, setIsEditMaterial] = useState(false);

    const [editingTransportIndex, setEditingTransportIndex] = useState<number | null>(null);
    const [isEditTransport, setIsEditTransport] = useState(false);
    const [editingTransportRow, setEditingTransportRow] = useState<any>(null);

    const [editingTransport, setEditingTransport] = useState<any>({
        Transporter: "",
        Destination: "",
        Rate: "",
    });

    const handleAddMaterial = () => {
        if (!selectedRow?.Party) {
            alert("Please select a party first");
            return;
        }

        setIsEditMaterial(false);          // ✅ ADD
        setEditingMaterialIndex(null);     // ✅ ADD
        setEditingMaterialRow(null);       // ✅ ADD

        setNewMaterial({
            Material: "",
            Measurement: "",
            Units: "Tonnes", // ✅ Default to Tonnes to avoid validation error if user doesn't change it
            Rate: "",
        });

        setShowAddMaterialModal(true);
    };



    const handleSaveNewTransport = async () => {
        if (
            !selectedRow?.Party ||
            !newTransport.Destination ||
            !newTransport.Measurement ||
            !newTransport.Rate
        ) {
            alert("Please fill all fields");
            return;
        }

        const transportersToSave = !isEditTransport
            ? (Array.isArray(newTransport.Transporter) ? newTransport.Transporter : [])
            : [newTransport.Transporter].filter(Boolean);

        if (transportersToSave.length === 0) {
            alert("Please select at least one Transporter");
            return;
        }

        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) {
                alert("ID missing");
                return;
            }

            if (isEditTransport) {
                const payload: any = {
                    Party: selectedRow.Party,
                    Transporter: newTransport.Transporter,
                    Destination: newTransport.Destination,
                    Measurement: newTransport.Measurement,
                    Amount: newTransport.Rate,
                };
                if (editingTransportRow?.ID) {
                    payload.ID = editingTransportRow.ID;
                }
                await axios.post(
                    `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyTransportSave`,
                    payload
                );
            } else {
                // Save all selected transporters
                const savePromises = transportersToSave.map((transporter) => {
                    const payload = {
                        Party: selectedRow.Party,
                        Transporter: transporter,
                        Destination: newTransport.Destination,
                        Measurement: newTransport.Measurement,
                        Amount: newTransport.Rate,
                    };
                    return axios.post(
                        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyTransportSave`,
                        payload
                    );
                });
                await Promise.all(savePromises);
            }

            // 🔄 AUTO REFRESH
            await fetchTransports();
            onSuccess?.();

            // 🧹 RESET
            setShowAddTransportModal(false);
            setIsEditTransport(false);
            setEditingTransportRow(null);

        } catch (error) {
            console.error("Save Transport Error:", error);
            alert("Failed to save transport");
        }
    };




    const handleAddTransport = () => {
        if (!selectedRow?.Party) {
            alert("Please select a party first");
            return;
        }

        setIsEditTransport(false);          // ✅ ADD MODE
        setEditingTransportRow(null);       // ✅ CLEAR EDIT DATA

        setNewTransport({
            Transporter: [],
            Destination: "",
            Rate: "",
            Measurement: "Tonnes", // ✅ Default to Tonnes
        });

        setShowAddTransportModal(true);
    };




    const handleEditMaterial = (row: any, index: number) => {
        setIsEditMaterial(true);
        setEditingMaterialIndex(index);
        setEditingMaterialRow(row);

        setNewMaterial({
            Material: row.Material,
            Units: row.Units,
            Rate: row.UnitRate,
            Measurement: row.Measurement ?? "",
        });

        setShowAddMaterialModal(true); // ✅ open SAME popup
    };





    const handleSaveNewMaterial = async () => {
        if (
            !selectedRow?.Party ||
            !newMaterial.Material ||
            !newMaterial.Units ||
            !newMaterial.Rate
        ) {
            alert("Please fill all fields");
            return;
        }

        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) {
                alert("ID missing");
                return;
            }

            await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyMaterialsSave`,
                {
                    Party: selectedRow.Party,
                    Material: newMaterial.Material,
                    Units: newMaterial.Units,
                    UnitRate: newMaterial.Rate,
                }
            );

            // ✅ EDIT MODE → UPDATE EXISTING ROW
            // ✅ EDIT → UPDATE EXISTING ROW ONLY



            setShowAddMaterialModal(false);
            setIsEditMaterial(false);
            setEditingMaterialIndex(null);
            setEditingMaterialRow(null);

            await fetchMaterials();
            onSuccess?.();
        } catch (error) {
            console.error("Save Material Error:", error);
            alert("Failed to save material");
        }
    };





    const handleDeleteMaterial = async (row: any) => {
        if (!window.confirm("Delete this material?")) return;

        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) {
                alert("ID missing");
                return;
            }

            await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyMaterialDelete`,
                {
                    IDS: row.ID, // ✅ USE ID FROM API RESPONSE
                }
            );

            // 🔄 AUTO REFRESH MATERIALS
            await fetchMaterials();
            onSuccess?.();

        } catch (error) {
            console.error("Delete Material Error:", error);
            alert("Failed to delete material");
        }
    };


    const handleEditTransport = (row: any, index: number) => {
        setIsEditTransport(true);           // ✅ EDIT MODE
        setEditingTransportRow(row);        // ✅ STORE ROW (HAS ID)

        setNewTransport({
            Transporter: row.Transporter,
            Destination: row.Destination,
            Measurement: row.Measurement ?? "",
            Rate: row.Amount,
        });

        setShowAddTransportModal(true);      // ✅ SAME POPUP
    };



    const handleDeleteTransport = async (row: any) => {
        if (!window.confirm("Delete this transport?")) return;

        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id) {
                alert("ID missing");
                return;
            }

            await axios.post(
                `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=PartyTransporterDelete`,
                {
                    IDS: row.ID, // ✅ REQUIRED BY BACKEND
                }
            );

            // 🔄 AUTO REFRESH TRANSPORT LIST
            await fetchTransports();
            onSuccess?.();

        } catch (error) {
            console.error("Delete Transport Error:", error);
            alert("Failed to delete transport");
        }
    };




    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    useEffect(() => {
        setVisibleColumns((prev) => {
            const allKeys = tableHeaders.map((h) => h.key);

            // keep unchecked columns unchecked, auto-add new ones
            return Array.from(new Set([...prev, ...allKeys]));
        });
    }, [tableHeaders]);


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

            if (searchOrPeriodChanged) {
                setCurrentPage(1);
            } else {
                const newTotalPages = Math.ceil(newFilteredDeals.length / itemsPerPage);
                setCurrentPage((prev) => Math.max(1, Math.min(prev, newTotalPages || 1)));
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
    }, [searchText, dealsData, selectedPeriod, periodField, itemsPerPage]);

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
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            return sortDirection === "asc"
                ? Number(aValue) - Number(bValue)
                : Number(bValue) - Number(aValue);
        }
        return sortDirection === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    const getStatusBadgeColor = (status: string) => {
        return status === "Won" ? "bg-success" : "bg-danger";
    };

    const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDeals = sortedDeals.slice(startIndex, endIndex);

    // --- Selection & Bulk Update Logic ---
    const allIdsOnPage = currentDeals.map((d) => d.ID).filter((id): id is string | number => id !== undefined);
    const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id) => selectedIds.includes(id));
    const isSomeSelected = allIdsOnPage.some((id) => selectedIds.includes(id)) && !isAllSelected;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onSelectionChange) return;
        if (e.target.checked) {
            const newSelection = Array.from(new Set([...selectedIds, ...allIdsOnPage]));
            onSelectionChange(newSelection);
        } else {
            const newSelection = selectedIds.filter((id) => !allIdsOnPage.includes(id));
            onSelectionChange(newSelection);
        }
    };

    const handleSelectRow = (id: string | number) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const handleInternalBulkSave = async () => {
        if (!onBulkUpdateSave || !bulkField) return;
        setIsSavingBulk(true);
        try {
            await onBulkUpdateSave(bulkField, bulkValue, selectedIds);
            setShowBulkUpdate(false);
            setBulkValue("");
            setBulkField("");
            if (onSelectionChange) onSelectionChange([]); // Clear selection after save
            onSuccess?.();
        } catch (error) {
            console.error("Bulk update failed", error);
        } finally {
            setIsSavingBulk(false);
        }
    };

    // 🔹 Calculate totals for numeric columns
    // 🔹 Calculate totals for numeric columns
    // 🔹 Calculate totals ONLY for Credit, Paid, Balance

    const totals: Record<string, string> = {};

    // ✅ Indian number format
    const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    tableHeaders.forEach((header) => {
        // ❌ REMOVE Balance from totals calculation
        if (
            ![
                "Credit",
                "Payable",
                "Paid",
                "Taxes",
                "Opening",
                "Gross",
                "Closing",
                "Tare",
                "Nett",
                "Rate",
                "ReceiptAmount",
                "Transport",
                "TransportForNet",
                "LessForNet",
                "NetTotal",
                "Total",
                "TotalAmount",
                "Less",
                "Amount",
                "Stationary",
                "DieselLitres",
                "DieselAmount",
                "Purchase",
                "Stock",
                "StockAmount",
            ].includes(header.key)
        ) {
            totals[header.key] = "";
            return;
        }

        let sum = 0;

        filteredDeals.forEach((deal) => {
            // ✅ ONLY skip if Blocked EXISTS and is actually blocked
            if (deal.Blocked && isBlocked(deal.Blocked)) return;

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

    // ✅ Indian currency formatter
    const indianCurrencyFormatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const toNumber = (val: any): number => {
        if (val === null || val === undefined) return 0;

        const cleaned = String(val).replace(/[^0-9.-]/g, "");
        const num = parseFloat(cleaned);

        return isNaN(num) ? 0 : num;
    };

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
    const [showCustomFilter, setShowCustomFilter] = useState(false);

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
        doc.setFont(undefined, "bold");
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
            (header) =>
                visibleColumns.includes(header.key) &&
                header.key !== "Blocked" &&
                header.key !== "__image"
        );

        const rows = sortedDeals
            .filter((deal) => !isBlocked(deal.Blocked))
            .map((deal, index) =>
                exportHeaders.map((header) => {
                    if (header.dataType === "index" || header.key === "sno") return index + 1;
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
        const visibleHeaders = tableHeaders.filter((h) =>
            visibleColumns.includes(h.key)
        );

        const exportData = filteredDeals
            .filter((deal) => !isBlocked(deal.Blocked))
            .map((deal, index) => {
                const obj: Record<string, string | number> = {};

                visibleHeaders.forEach((h) => {
                    const value = (h.key === "sno" || h.dataType === "index") ? index + 1 : deal[h.key];

                    if (h.dataType === "number") {
                        const num = Number(String(value ?? 0).replace(/,/g, ""));
                        obj[h.label] = isNaN(num)
                            ? ""
                            : Number(num.toFixed(2)); // ✅ max 2 decimals
                    } else {
                        obj[h.label] = value ?? "";
                    }
                });

                return obj;
            });

        const totalsRow: Record<string, string | number> = {};
        visibleHeaders.forEach((h, i) => {
            let totalValue = totals[h.key] || "";
            // If it's a weight column, ensuring we use the already formatted tonne value from 'totals'
            // or if we were to recalculate, it should be sum / 1000.
            // Since `totals[h.key]` is already formatted as a string by indianNumberFormatter,
            // we can just use it.
            totalsRow[h.label] = i === 0 ? "Total" : totalValue;
        });
        exportData.push(totalsRow);

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

    const toggleColumn = (key: string) => {
        setVisibleColumns((prev) =>
            prev.includes(key)
                ? prev.filter((col) => col !== key)
                : [...prev, key]
        );
    };

    useEffect(() => {
        if (showMaterialCanvas && selectedRow?.Party) {



            fetchMaterials();
        }
    }, [showMaterialCanvas, selectedRow]);
    useEffect(() => {
        if (showTransportCanvas && selectedRow?.Party) {
            fetchTransports();
        }
    }, [showTransportCanvas, selectedRow]);


    const [transportRows, setTransportRows] = useState<any[]>([]);


    const OffcanvasBackdrop = ({ onClose }: { onClose: () => void }) => (
        <div
            className="offcanvas-backdrop fade show"
            onClick={onClose}
            style={{ cursor: "pointer" }}
        />
    );


    return (
        <div className="d-flex flex-column">
            {showControls && (
                <div className="card shadow-sm rounded-3 m-1">
                    <div className="card-body">
                        <div className="row g-3 align-items-center">
                            {/* Search + Filter */}

                            <div className="col-12 col-md-4 d-flex align-items-center gap-2">
                                <div className="position-relative" style={{ width: "250px" }}>
                                    <input
                                        type="text"
                                        className="form-control ps-5 pe-5 rounded"
                                        placeholder="Search..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />

                                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted text-primary" />
                                    {searchText && (
                                        <button
                                            type="button"
                                            className="btn btn-sm border-0 bg-transparent position-absolute top-50 end-0 translate-middle-y me-2 text-muted"
                                            onClick={handleResetSearch}
                                        >
                                            <i className="bi bi-x-lg text-primary"></i>
                                        </button>
                                    )}

                                </div>
                                {customFilter && (
                                    <button
                                        className="btn btn-outline-primary shadow"
                                        onClick={() => setShowCustomFilter((prev) => !prev)}
                                        title="Filter"
                                    >
                                        <i className="bi bi-funnel"></i>
                                    </button>
                                )}
                                {handleShow && (
                                    <button
                                        className="btn btn-outline-primary shadow"
                                        onClick={() => {
                                            setShowCustomFilter((prev) => !prev);
                                            handleShow({});
                                        }}
                                    >
                                        <i className="bi bi-sliders2"></i>
                                    </button>
                                )}
                                {customFilter && showCustomFilter && (
                                    <div className="mt-3 w-180">
                                        <div className="card shadow-sm" style={{ width: "620px" }}>

                                            {customFilter}

                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Period + Export + Column Chooser */}
                            <div className="col-12 col-md-8 d-flex justify-content-md-end flex-wrap gap-2">

                                {handleImport && (
                                    <button
                                        className="btn btn-outline-primary shadow d-flex align-items-center"
                                        onClick={() => handleImport({})}
                                    >
                                        import
                                    </button>
                                )}
                                {handleSummary && (
                                    <button
                                        className="btn btn-outline-primary shadow d-flex align-items-center"
                                        onClick={() => handleSummary({})}
                                    >
                                        Summary
                                    </button>
                                )}


                                {/* 🔹 Column Chooser (only if more than 8 fields) */}
                                {tableHeaders.length > 8 && (
                                    <div className="dropdown">
                                        <button
                                            className="btn btn-outline-primary shadow dropdown-toggle"
                                            data-bs-toggle="dropdown"
                                        >
                                            Columns
                                        </button>
                                        <div className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                                            {tableHeaders
                                                .filter((h) => h.key !== "NettWeight")   // ✅ HIDE ONLY FROM DROPDOWN
                                                .map((h) => (
                                                    <div className="form-check" key={h.key}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id={`col-${h.key}`}
                                                            checked={visibleColumns.includes(h.key)}
                                                            onChange={() => toggleColumn(h.key)}
                                                        />
                                                        <label htmlFor={`col-${h.key}`} className="form-check-label">
                                                            {h.label}
                                                        </label>
                                                    </div>
                                                ))}

                                        </div>
                                    </div>
                                )}

                                <button
                                    className="btn btn-outline-primary shadow"
                                    onClick={handleExportExcel}
                                >
                                    <i className="ti ti-file-spreadsheet fs-4"></i>
                                </button>
                                <button
                                    className="btn btn-outline-primary shadow"
                                    onClick={handleExportPdf}
                                    title="Download PDF"
                                >
                                    <i className="ti ti-file-type-pdf fs-4"></i>
                                </button>

                                {/* Send Mail */}
                                <button
                                    className="btn btn-outline-primary shadow"
                                    onClick={handleMailPdf}
                                    title="Send Mail"
                                >
                                    <i className="ti ti-mail fs-4"></i>
                                </button>

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

                                {selectedIds.length > 0 && bulkUpdateFields && (
                                    <button
                                        className="btn btn-warning shadow d-flex align-items-center gap-2"
                                        onClick={() => setShowBulkUpdate(true)}
                                    >
                                        <i className="bi bi-pencil-square"></i> Bulk Update ({selectedIds.length})
                                    </button>
                                )}

                                {onAddClick && (
                                    <button
                                        className="btn btn-sm shadow d-flex align-items-center me-2"
                                        style={{
                                            backgroundColor: "#ffab2deb",
                                            color: "#fff",
                                            borderColor: "#ffab2deb",
                                            padding: "4px 10px",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#e09524";
                                            e.currentTarget.style.borderColor = "#e09524";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "#ffab2deb";
                                            e.currentTarget.style.borderColor = "#ffab2deb";
                                        }}
                                        onClick={onAddClick}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i>
                                        {addClickText || "Add"}
                                    </button>
                                )}

                                {onAddLedgerClick && (
                                    <button
                                        className="btn btn-sm shadow d-flex align-items-center"
                                        style={{
                                            backgroundColor: "#dc3545",
                                            color: "#fff",
                                            borderColor: "#dc3545",
                                            padding: "4px 10px",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = "#bb2d3b")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "#dc3545")
                                        }
                                        onClick={onAddLedgerClick}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i>
                                        Add Ledger
                                    </button>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            )}

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
                                const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
                                chips.push(
                                    <div key={key} className="badge bg-white text-dark border border-secondary border-opacity-25 d-flex align-items-center py-2 px-3 shadow-sm rounded-pill">
                                        <span className="text-muted me-1">{displayKey}:</span> <span className="text-primary">{String(value)}</span>
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
                                                ref={(el) => {
                                                    if (el) el.indeterminate = isSomeSelected;
                                                }}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    {tableHeaders
                                        .filter((h) => visibleColumns.includes(h.key))
                                        .map((header, index) => {
                                            const alignmentClass =
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
                                                            <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                                                        )}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    {(renderRowActions || handleView || handleEdit) && (
                                        <th
                                            className="bg-primary bg-opacity-10 text-primary text-center"
                                            style={{ minWidth: "120px" }}
                                        >
                                            Actions
                                        </th>
                                    )}


                                </tr>
                            </thead>

                            <style>
                                {`
                                    @media print {
                                        tr[style*="not-allowed"], 
                                        tr.blocked-row {
                                            display: none !important;
                                        }
                                    }
                                `}
                            </style>

                            <tbody>
                                {currentDeals.length > 0 ? (
                                    <>
                                        {currentDeals.map((deal, index) => (
                                            <tr
                                                key={index}
                                                className={rowClassName ? rowClassName(deal) : ""}
                                                style={{
                                                    cursor: isBlocked(deal.Blocked) ? "not-allowed" : "pointer",
                                                    textDecoration: isBlocked(deal.Blocked) ? "line-through" : "none",
                                                    opacity: isBlocked(deal.Blocked) ? 0.55 : 1,
                                                    backgroundColor: isBlocked(deal.Blocked) ? "#f8d7da" : (rowClassName ? undefined : "transparent"),
                                                }}
                                                onClick={
                                                    isBlocked(deal.Blocked)
                                                        ? undefined
                                                        : () => {
                                                            // If clicking on row (not checkbox/action), trigger handleLine
                                                            if (handleLine) handleLine(deal);
                                                        }
                                                }
                                            >
                                                {onSelectionChange && (
                                                    <td className="text-center py-3">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            checked={selectedIds.includes(deal.ID as any)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={() => handleSelectRow(deal.ID as any)}
                                                        />
                                                    </td>
                                                )}
                                                {tableHeaders
                                                    .filter((h) => visibleColumns.includes(h.key))
                                                    .map((header, i) => {
                                                        const value =
                                                            header.key === "sno"
                                                                ? startIndex + index + 1 // ✅ pagination-safe auto S.No
                                                                : deal[header.key];


                                                        const alignmentClass =
                                                            header.dataType === "number"
                                                                ? "text-end"
                                                                : "text-start";
                                                        // ===== IMAGE COLUMN =====
                                                        if (header.key === "__image") {
                                                            return (
                                                                <td key={i} className="text-center py-3">
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        style={{
                                                                            backgroundColor: "#0d6efd",
                                                                            color: "#fff",
                                                                            borderColor: "#0d6efd",
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            fetchSalesImages(deal);
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                </td>
                                                            );
                                                        }


                                                        return (
                                                            <td key={i} className={`py-3 ${alignmentClass}`}>
                                                                {linkField && header.key === linkField ? (
                                                                    <Link
                                                                        to={linkRoute || "#"}
                                                                        className="text-primary fw-bold text-decoration-none"
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
                                                                ) : header.key === "Blocked" ? (
                                                                    <span
                                                                        role="button"
                                                                        className={`fw-semibold ${isBlocked(value) ? "text-danger" : "text-success"
                                                                            }`}
                                                                        style={{
                                                                            cursor: "pointer",
                                                                            textDecoration: "underline",
                                                                            pointerEvents: "auto",
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); // prevent row click
                                                                            toggleBlockedStatus(deal);
                                                                        }}
                                                                    >
                                                                        {formatBlockedText(value)}
                                                                    </span>
                                                                )

                                                                    : (
                                                                        <span
                                                                            className={
                                                                                header.dataType === "number"
                                                                                    ? "fw-semibold text-end"
                                                                                    : "text-dark"
                                                                            }
                                                                        >
                                                                            {header.key === "sno"
                                                                                ? value
                                                                                : header.dataType === "number"
                                                                                    ? ["Gross", "Tare", "Nett", "ActualNett", "Stationary"].includes(header.key)
                                                                                        ? indianNumberFormatter.format(toNumber(value) / 1000)
                                                                                        : ["Boulders", "Yard", "TotalSales", "YardSales", "Balance", "Stock", "DieselLitres"].includes(header.key)
                                                                                            ? indianNumberFormatter.format(toNumber(value))
                                                                                            : indianCurrencyFormatter.format(toNumber(value))
                                                                                    : value ?? "-"
                                                                            }

                                                                        </span>


                                                                    )
                                                                }
                                                            </td>
                                                        );
                                                    })}

                                                {/* Actions */}
                                                {/* Actions */}
                                                {(renderRowActions || handleView || handleEdit) && (
                                                    <td className="text-center py-3">
                                                        <div className="d-flex justify-content-center align-items-center gap-2">

                                                            {handleView && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    title="View"
                                                                    disabled={isBlocked(deal.Blocked)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isBlocked(deal.Blocked)) return;
                                                                        setSelectedRow(deal);

                                                                        setViewFilter({
                                                                            Party: deal.Party,
                                                                            FromDate: "",
                                                                            ToDate: "",
                                                                        });

                                                                        setViewData([]); // reset old data
                                                                        setShowViewCanvas(true);
                                                                        handleView(deal);

                                                                    }}
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                            )}

                                                            {handleEdit && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-warning"
                                                                    title="Edit"
                                                                    disabled={isBlocked(deal.Blocked)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isBlocked(deal.Blocked)) return;
                                                                        handleEdit(deal);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                            )}

                                                            {renderRowActions && (
                                                                <div className="d-flex gap-2">
                                                                    {renderRowActions({
                                                                        ...deal,
                                                                        __openMaterial: () => {
                                                                            if (isBlocked(deal.Blocked)) return;
                                                                            setSelectedRow(deal);
                                                                            setShowMaterialCanvas(true);
                                                                        },
                                                                        __openTransport: () => {
                                                                            if (isBlocked(deal.Blocked)) return;
                                                                            setSelectedRow(deal);
                                                                            setShowTransportCanvas(true);
                                                                        },
                                                                    })}
                                                                </div>
                                                            )}

                                                        </div>
                                                    </td>
                                                )}

                                            </tr>
                                        ))}

                                        {/* Totals Row */}
                                        <tr>
                                            {onSelectionChange && <td className="bg-light"></td>}
                                            {tableHeaders
                                                .filter((h) => visibleColumns.includes(h.key))
                                                .map((header, i) => {
                                                    const alignmentClass =
                                                        header.dataType === "number"
                                                            ? "text-end"
                                                            : "text-start";

                                                    if (i === 0) {
                                                        return (
                                                            <td
                                                                key={i}
                                                                className={`fw-bold py-3 ${alignmentClass}`}
                                                                style={{ color: "#000000" }}
                                                            >
                                                                Total
                                                            </td>
                                                        );
                                                    }

                                                    const rawValue =
                                                        ["Rate", "Stationary", "Vehicle"].includes(header.key)
                                                            ? ""
                                                            : totals[header.key];

                                                    const num = Number(rawValue);
                                                    let cellClass = "fw-bold";

                                                    if (!isNaN(num) && rawValue !== "") {
                                                        cellClass += num < 0 ? " text-danger" : " text-success";
                                                    } else {
                                                        cellClass += " text-dark";
                                                    }

                                                    return (
                                                        <td
                                                            key={i}
                                                            className={`${cellClass} py-3 ${alignmentClass}`}
                                                        >
                                                            {rawValue}
                                                        </td>
                                                    );
                                                })}
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={
                                                tableHeaders.filter((h) => visibleColumns.includes(h.key)).length +
                                                ((renderRowActions || handleView) ? 1 : 0)
                                            }
                                            className="text-center py-5"
                                        >
                                            <i className="bi bi-search display-6 text-muted d-block mb-2"></i>
                                            <span className="text-muted">No data available</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
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
                                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredDeals.length)} of {filteredDeals.length}{" "}
                                records
                            </span>
                        </div>

                        {totalPages > 1 && (
                            <nav>
                                <ul className="pagination mb-0 flex-wrap">
                                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(
                                            (page) =>
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 &&
                                                    page <= currentPage + 1)
                                        )
                                        .map((page, idx, arr) => {
                                            const prevPage = arr[idx - 1];
                                            return (
                                                <React.Fragment key={page}>
                                                    {prevPage && page - prevPage > 1 && (
                                                        <li className="page-item disabled">
                                                            <span className="page-link">…</span>
                                                        </li>
                                                    )}
                                                    <li
                                                        className={`page-item ${page === currentPage ? "active" : ""
                                                            }`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </button>
                                                    </li>
                                                </React.Fragment>
                                            );
                                        })}

                                    <li
                                        className={`page-item ${currentPage === totalPages ? "disabled" : ""
                                            }`}
                                    >
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
            {/* ================= VIEW OFFCANVAS ================= */}
            {showViewCanvas && (
                <OffcanvasBackdrop onClose={() => setShowViewCanvas(false)} />
            )}
            <div
                className={`offcanvas offcanvas-end ${showViewCanvas ? "show" : ""}`}
                style={{
                    width: "80%",
                    visibility: showViewCanvas ? "visible" : "hidden"
                }}
            >
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title">View Details</h5>
                    <button
                        className="btn-close"
                        onClick={() => setShowViewCanvas(false)}
                    ></button>
                </div>
                <div className="offcanvas-body">
                    {selectedRow ? (

                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <h6 className="card-title mb-3 text-primary">
                                    Debitor Details
                                </h6>

                                <div className="row g-3">
                                    {Object.entries(selectedRow)
                                        .filter(([key]) => key !== "sno")
                                        .map(([key, value]) => (

                                            <div className="col-12 col-md-6" key={key}>
                                                <div className="border rounded p-2 h-100">
                                                    <small className="text-muted d-block">
                                                        {key}
                                                    </small>
                                                    <span className="fw-semibold text-dark">
                                                        {value ?? "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted">
                            No data selected
                        </div>
                    )}
                    {/* ================= FILTER SECTION ================= */}
                    <div className="card mb-3 shadow-sm">

                        <div className="card-body">
                            <div className="row g-3">

                                <div className="col-md-4">
                                    <label className="form-label">Party</label>
                                    <input
                                        className="form-control"
                                        value={viewFilter.Party}
                                        readOnly
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">From Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={viewFilter.FromDate}
                                        onChange={(e) =>
                                            setViewFilter({ ...viewFilter, FromDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">To Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={viewFilter.ToDate}
                                        onChange={(e) =>
                                            setViewFilter({ ...viewFilter, ToDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="col-md-2 d-flex align-items-end">
                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={async () => {
                                            try {
                                                const id = sessionStorage.getItem("selectedItems") ?? "";
                                                setViewLoading(true);

                                                const res = await axios.post(
                                                    `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=DebitorStatement`,
                                                    viewFilter
                                                );


                                                setViewData(Array.isArray(res.data) ? res.data : []);
                                            } catch (err) {
                                                console.error("Filter failed", err);
                                                setViewData([]);
                                            } finally {
                                                setViewLoading(false);
                                            }
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>

                            </div>
                        </div>
                        {/* ================= STATEMENT TABLE ================= */}

                        {viewLoading && (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" />
                            </div>
                        )}

                        {!viewLoading && viewData.length > 0 && (
                            <div className="card shadow-sm">
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>DC No</th>
                                                    <th>Vehicle</th>
                                                    <th>Material</th>
                                                    <th>Destination</th>
                                                    <th className="text-end">Rate</th>
                                                    <th className="text-end">Nett</th>
                                                    <th className="text-end">Amount</th>
                                                    <th className="text-end">Paid</th>
                                                    <th className="text-end">Balance</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {viewData.map((row, index) => (
                                                    <tr key={index}>
                                                        <td>{row.Date || "-"}</td>
                                                        <td>{row.DCNum || "-"}</td>
                                                        <td>{row.Vehicle || "-"}</td>
                                                        <td>{row.Material || "-"}</td>
                                                        <td>{row.Destination || "-"}</td>

                                                        <td className="text-end">
                                                            {row.Rate ? Number(row.Rate).toLocaleString("en-IN") : "-"}
                                                        </td>

                                                        <td className="text-end">
                                                            {row.Nett ? Number(row.Nett).toLocaleString("en-IN") : "-"}
                                                        </td>

                                                        <td className="text-end">
                                                            {row.Amount ? Number(row.Amount).toLocaleString("en-IN") : "-"}
                                                        </td>

                                                        <td className="text-end">
                                                            {row.Paid ? Number(row.Paid).toLocaleString("en-IN") : "-"}
                                                        </td>

                                                        <td className="text-end fw-bold text-danger">
                                                            {row.Balance
                                                                ? Number(row.Balance).toLocaleString("en-IN")
                                                                : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!viewLoading && viewData.length === 0 && (
                            <div className="text-center text-muted py-4">
                                No statement data found
                            </div>
                        )}


                    </div>

                </div>
            </div>

            {/* ================= MATERIAL OFFCANVAS ================= */}
            {showMaterialCanvas && (
                <OffcanvasBackdrop onClose={() => setShowMaterialCanvas(false)} />
            )}
            <div
                className={`offcanvas offcanvas-end ${showMaterialCanvas ? "show" : ""}`}
                style={{
                    width: "80%",
                    visibility: showMaterialCanvas ? "visible" : "hidden"
                }}
            >
                <div className="offcanvas-header d-flex justify-content-between align-items-center">
                    <h5 className="offcanvas-title ">Material Details</h5>

                    <div className="d-flex align-items-center  gap-2">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleAddMaterial}
                        >
                            <i className="bi bi-plus-circle me-1"></i>
                            Add Material
                        </button>

                        <button
                            className="btn-close"
                            onClick={() => setShowMaterialCanvas(false)}
                        ></button>
                    </div>
                </div>


                <div className="offcanvas-body">
                    <p className="fw-bold mb-2">
                        Party: {selectedRow?.Party}
                    </p>

                    <div className="table-responsive">
                        <table className="table table-bordered table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>S.No</th>
                                    <th>Material</th>
                                    <th>Units</th>
                                    <th className="text-end">Rate</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materialRows.length > 0 ? (
                                    materialRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{row.Material}</td>
                                            <td>{row.Units}</td>
                                            <td className="text-end">{row.UnitRate}</td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => handleEditMaterial(row, index)}

                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteMaterial(row, index)}
                                                >

                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>

                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">
                                            No material records
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>
                </div>
            </div>
            {showAddMaterialModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {isEditMaterial ? "Edit Material" : "Add Material"}
                                    </h5>

                                    <button
                                        className="btn-close"
                                        onClick={() => setShowAddMaterialModal(false)}
                                    />
                                </div>

                                <div className="modal-body">

                                    <div className="mb-3">
                                        <label className="form-label">Party</label>
                                        <input
                                            className="form-control"
                                            value={selectedRow?.Party || ""}
                                            readOnly
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Material</label>
                                        <select
                                            className="form-select"
                                            value={newMaterial.Material}
                                            onChange={(e) =>
                                                setNewMaterial({ ...newMaterial, Material: e.target.value })
                                            }
                                        >
                                            <option value="">Select Material</option>
                                            {materialMaster.map((mat, idx) => (
                                                <option key={idx} value={mat}>
                                                    {mat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    <div className="mb-3">
                                        <label className="form-label">Units</label>
                                        <select
                                            className="form-select"
                                            value={newMaterial.Units}
                                            onChange={(e) =>
                                                setNewMaterial({ ...newMaterial, Units: e.target.value })
                                            }
                                        >
                                            <option value="">Select Units</option>
                                            <option value="Tonnes">Tonnes</option>
                                            <option value="Units">Units</option>
                                            <option value="CBM">CBM</option>
                                        </select>
                                    </div>


                                    <div className="mb-3">
                                        <label className="form-label">Rate</label>
                                        <input
                                            type="number"
                                            className="form-control text-end"
                                            value={newMaterial.Rate}
                                            onChange={(e) =>
                                                setNewMaterial({ ...newMaterial, Rate: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddMaterialModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveNewMaterial}
                                    >
                                        Save
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}


            {showAddTransportModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content">

                                <div className="modal-header">
                                    <h5 className="modal-title">Add Transport</h5>
                                    <button
                                        className="btn-close"
                                        onClick={() => setShowAddTransportModal(false)}
                                    />
                                </div>

                                <div className="modal-body">
                                    {/* Party (Auto) */}
                                    <div className="mb-3">
                                        <label className="form-label">Party</label>
                                        <input
                                            className="form-control"
                                            value={selectedRow?.Party || ""}
                                            readOnly
                                        />
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Transporter</label>
                                            <Select
                                                isMulti={!isEditTransport}
                                                options={transporterOptions}
                                                value={
                                                    !isEditTransport
                                                        ? transporterOptions.filter(
                                                              (opt) =>
                                                                  Array.isArray(newTransport.Transporter) &&
                                                                  newTransport.Transporter.includes(opt.value)
                                                          )
                                                        : transporterOptions.find(
                                                              (opt) => opt.value === newTransport.Transporter
                                                          ) || null
                                                }
                                                onChange={(selected: any) => {
                                                    if (!isEditTransport) {
                                                        const selectedValues = selected
                                                            ? selected.map((opt: any) => opt.value)
                                                            : [];
                                                        setNewTransport({
                                                            ...newTransport,
                                                            Transporter: selectedValues,
                                                        });
                                                    } else {
                                                        setNewTransport({
                                                            ...newTransport,
                                                            Transporter: selected ? selected.value : "",
                                                        });
                                                    }
                                                }}
                                                placeholder={!isEditTransport ? "Select Transporter(s)" : "Select Transporter"}
                                                isSearchable
                                                isClearable
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Destination</label>
                                            <input
                                                className="form-control"
                                                value={newTransport.Destination}
                                                onChange={(e) =>
                                                    setNewTransport({
                                                        ...newTransport,
                                                        Destination: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Measurement</label>
                                            <select
                                                className="form-select"
                                                value={newTransport.Measurement}
                                                onChange={(e) =>
                                                    setNewTransport({
                                                        ...newTransport,
                                                        Measurement: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="">Select Measurement</option>
                                                <option value="Tonnes">Tonnes</option>
                                            </select>
                                        </div>


                                        <div className="col-md-6">
                                            <label className="form-label">Rate</label>
                                            <input
                                                type="number"
                                                className="form-control text-end"
                                                value={newTransport.Rate}
                                                onChange={(e) =>
                                                    setNewTransport({
                                                        ...newTransport,
                                                        Rate: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>


                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddTransportModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveNewTransport}
                                    >
                                        Save
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* ===== SALES IMAGE MODAL ===== */}
            {showImageCanvas && (
                <OffcanvasBackdrop onClose={() => setShowImageCanvas(false)} />

            )}
            {/* ================= IMAGE OFFCANVAS ================= */}
            <div
                className={`offcanvas offcanvas-end ${showImageCanvas ? "show" : ""}`}
                style={{
                    width: "80%",
                    visibility: showImageCanvas ? "visible" : "hidden",
                }}
            >
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title">Sales Images</h5>
                    <button
                        className="btn-close"
                        onClick={() => setShowImageCanvas(false)}
                    />
                </div>

                <div className="offcanvas-body">

                    {/* 🔄 LOADING STATE */}
                    {imageLoading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                            <div className="text-muted mt-2">Loading images...</div>
                        </div>
                    )}

                    {/* 🖼️ IMAGES */}
                    {!imageLoading && imageList.length > 0 && (
                        <div className="row g-3">
                            {imageList.map((img, idx) => (
                                <div className="col-md-4" key={idx}>
                                    <img
                                        src={`data:image/jpeg;base64,${img}`}
                                        alt={`Sales ${idx + 1}`}
                                        className="img-fluid rounded border"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🚫 NO IMAGES */}
                    {!imageLoading && imageList.length === 0 && (
                        <div className="text-center text-muted py-5">
                            No images found
                        </div>
                    )}

                </div>

            </div>

            {/* ================= BULK UPDATE OFFCANVAS ================= */}
            {showBulkUpdate && (
                <OffcanvasBackdrop onClose={() => setShowBulkUpdate(false)} />
            )}
            <div
                className={`offcanvas offcanvas-end ${showBulkUpdate ? "show" : ""}`}
                style={{
                    width: "400px",
                    visibility: showBulkUpdate ? "visible" : "hidden",
                }}
            >
                <div className="offcanvas-header bg-warning text-dark">
                    <h5 className="offcanvas-title fw-bold">
                        Bulk Update ({selectedIds.length} Items)
                    </h5>
                    <button
                        className="btn-close"
                        onClick={() => setShowBulkUpdate(false)}
                    ></button>
                </div>
                <div className="offcanvas-body">
                    <div className="alert alert-info py-2 small mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        Select a field and enter a new value to update all selected records.
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Select Field to Update</label>
                        <select
                            className="form-select border-primary"
                            value={bulkField}
                            onChange={(e) => setBulkField(e.target.value)}
                        >
                            <option value="">-- Select Field --</option>
                            {bulkUpdateFields?.map((f) => (
                                <option key={f.key} value={f.key}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {bulkField && (
                        <div className="mb-4 animate__animated animate__fadeIn">
                            <label className="form-label fw-semibold">New Value</label>
                            {bulkUpdateFields?.find((f) => f.key === bulkField)?.type === "date" ? (
                                <input
                                    type="date"
                                    className="form-control border-primary"
                                    value={bulkValue}
                                    onChange={(e) => setBulkValue(e.target.value)}
                                />
                            ) : bulkUpdateFields?.find((f) => f.key === bulkField)?.type === "number" ? (
                                <input
                                    type="number"
                                    className="form-control border-primary"
                                    value={bulkValue}
                                    onChange={(e) => setBulkValue(e.target.value)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="form-control border-primary"
                                    placeholder="Enter new value..."
                                    value={bulkValue}
                                    onChange={(e) => setBulkValue(e.target.value)}
                                />
                            )}
                        </div>
                    )}

                    <div className="d-grid gap-2 mt-auto">
                        <button
                            className="btn btn-primary btn-lg"
                            disabled={!bulkField || !bulkValue || isSavingBulk}
                            onClick={handleInternalBulkSave}
                        >
                            {isSavingBulk ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => setShowBulkUpdate(false)}
                            disabled={isSavingBulk}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>



            {/* ================= TRANSPORT OFFCANVAS ================= */}
            {showTransportCanvas && (
                <OffcanvasBackdrop onClose={() => setShowTransportCanvas(false)} />
            )}
            <div
                className={`offcanvas offcanvas-end  ${showTransportCanvas ? "show" : ""}`}
                style={{ width: "80%", visibility: showTransportCanvas ? "visible" : "hidden" }}
            >
                <div className="offcanvas-header d-flex justify-content-between align-items-center">
                    <h5 className="offcanvas-title">Transport Details</h5>

                    <div className="d-flex align-items-center  gap-2">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleAddTransport}
                        >
                            <i className="bi bi-plus-circle me-1"></i>
                            Add Transport


                        </button>

                        <button
                            className="btn-close"
                            onClick={() => setShowTransportCanvas(false)}
                        ></button>
                    </div>
                </div>

                <div className="offcanvas-body">
                    <p className="fw-bold mb-2">
                        Party: {selectedRow?.Party}
                    </p>

                    <div className="table-responsive">
                        <table className="table table-bordered table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>S.No</th>
                                    <th>Transporter</th>
                                    <th>Destination</th>
                                    <th className="text-end">Rate</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {transportRows.length > 0 ? (
                                    transportRows.map((row, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{row.Transporter}</td>
                                            <td>{row.Destination}</td>
                                            <td className="text-end">{row.Amount}</td>

                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => handleEditTransport(row, index)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteTransport(row)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">
                                            No transport records
                                        </td>
                                    </tr>
                                )}
                            </tbody>


                        </table>
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

export default ProductionList;
