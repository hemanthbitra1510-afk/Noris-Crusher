import { useState, useEffect, useRef } from "react";

interface DashboardListRow {
    [key: string]: string | number | null | undefined;
}

interface TableHeader {
    label: string;
    key: string;
}

interface DashboardListProps {
    tableHeaders: TableHeader[];
    dealsData: DashboardListRow[];
    onUpload?: (rows: DashboardListRow[]) => void;
}

const BlukImport = ({
    tableHeaders,
    dealsData,
    onUpload,
}: DashboardListProps) => {

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchText, setSearchText] = useState("");
    const [filteredDeals, setFilteredDeals] = useState<DashboardListRow[]>(dealsData);

    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    /** ✅ COLUMN CHOOSER STATE */
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        tableHeaders.map(h => h.key)
    );

    /** Refresh when new Excel uploaded */
    useEffect(() => {
        setFilteredDeals(dealsData);
        setSelectedRows([]);
        setCurrentPage(1);
    }, [dealsData]);

    /** SEARCH */
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            const lower = searchText.toLowerCase();

            const filtered = dealsData.filter(row =>
                Object.values(row).some(
                    v =>
                        v !== null &&
                        v !== undefined &&
                        String(v).toLowerCase().includes(lower)
                )
            );

            setFilteredDeals(filtered);
            setSelectedRows([]);
            setCurrentPage(1);
        }, 200);

    }, [searchText, dealsData]);

    /** SORT */
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const sortedDeals = [...filteredDeals].sort((a, b) => {
        if (!sortKey) return 0;

        const av = a[sortKey];
        const bv = b[sortKey];

        if (av == null) return 1;
        if (bv == null) return -1;

        if (typeof av === "string" && typeof bv === "string") {
            return sortDirection === "asc"
                ? av.localeCompare(bv)
                : bv.localeCompare(av);
        }

        if (typeof av === "number" && typeof bv === "number") {
            return sortDirection === "asc" ? av - bv : bv - av;
        }

        return 0;
    });

    /** PAGINATION */
    const totalPages = Math.max(1, Math.ceil(filteredDeals.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredDeals.length);
    const currentDeals = sortedDeals.slice(startIndex, endIndex);

    /** CHECKBOX LOGIC */
    const allChecked =
        selectedRows.length === filteredDeals.length && filteredDeals.length > 0;

    const handleSelectAll = () => {
        if (allChecked) setSelectedRows([]);
        else setSelectedRows(filteredDeals.map((_, i) => i));
    };

    const toggleRow = (index: number) => {
        setSelectedRows(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    /** DELETE (UI ONLY) */
    const deleteSelected = () => {
        if (!selectedRows.length) return;
        if (!window.confirm(`Delete ${selectedRows.length} rows?`)) return;

        const remaining = filteredDeals.filter((_, i) => !selectedRows.includes(i));
        setFilteredDeals(remaining);
        setSelectedRows([]);
    };

    /** UPLOAD */
    const handleUpload = () => {
        const rows = filteredDeals.filter((_, i) => selectedRows.includes(i));
        if (!rows.length) return alert("No rows selected");
        onUpload?.(rows);
    };

    /** COLUMN TOGGLE */
    const toggleColumn = (key: string) => {
        setVisibleColumns(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    return (
        <div className="d-flex flex-column">

            {/* ACTION BAR */}
            <div className="card shadow-sm m-1">
                <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">

                    <div className="d-flex flex-wrap align-items-center gap-2" style={{ flex: 1 }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search..."
                            style={{ minWidth: 200 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />

                        {/* COLUMN CHOOSER */}
                        <div className="dropdown">
                            <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                            >
                                Columns
                            </button>
                            <ul className="dropdown-menu p-2">
                                {tableHeaders.map(h => (
                                    <li key={h.key} className="dropdown-item">
                                        <label className="d-flex align-items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(h.key)}
                                                onChange={() => toggleColumn(h.key)}
                                            />
                                            {h.label}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedRows.length > 0 && (
                            <>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={deleteSelected}
                                >
                                    <i className="ti ti-trash"></i>
                                </button>

                                <button
                                    className="btn btn-outline-success"
                                    onClick={handleUpload}
                                >
                                    <i className="ti ti-cloud-upload"></i>
                                </button>
                            </>
                        )}
                    </div>

                    <span className="fw-semibold text-success">
                        Items : {selectedRows.length}
                    </span>
                </div>
            </div>

            {/* TABLE */}
            <div className="card m-1">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>S.No</th>

                                {tableHeaders
                                    .filter(h => visibleColumns.includes(h.key))
                                    .map(h => (
                                        <th
                                            key={h.key}
                                            onClick={() => handleSort(h.key)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {h.label}
                                            {sortKey === h.key && (
                                                <span className="ms-1">
                                                    {sortDirection === "asc" ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                            </tr>
                        </thead>

                        <tbody>
                            {currentDeals.length ? (
                                currentDeals.map((row, idx) => {
                                    const actualIndex = startIndex + idx;

                                    return (
                                        <tr key={actualIndex}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(actualIndex)}
                                                    onChange={() => toggleRow(actualIndex)}
                                                />
                                            </td>
                                            <td>{actualIndex + 1}</td>

                                            {tableHeaders
                                                .filter(h => visibleColumns.includes(h.key))
                                                .map(h => (
                                                    <td key={h.key}>{row[h.key]}</td>
                                                ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 2} className="text-center py-4">
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="card-footer d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 align-items-center">
                        <span>Rows</span>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 20, 30, 50, 100].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span>
                            {startIndex + 1}–{endIndex} of {filteredDeals.length}
                        </span>
                    </div>

                    <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                ‹
                            </button>
                        </li>

                        {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            </li>
                        ))}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                ›
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BlukImport;
