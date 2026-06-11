
import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import LedgerTypeForm from "./LedgerTypeForm";
import { useToast } from "../../../components/reuse-components/Toast";
import ListComponent from "../../../components/reuse-components/listComponent";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface LedgerTypeItem {
    [key: string]: string | number | null | undefined;
    ID: string;
    LedgerType: string;
}

interface Filters {
    LedgerType: string;
}

const LedgerType = () => {
    const showToast = useToast();
    const [ledgerTypeList, setLedgerTypeList] = useState<LedgerTypeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState<any | null>(null);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Ledger Type", key: "LedgerType", dataType: "string" },
    ];

    const [filters, setFilters] = useState<Filters>({
        LedgerType: "",
    });

    const apiGet = useCallback(async (filterData?: Filters) => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgerType`,
                {}
            );

            setLedgerTypeList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching ledger type data:", err);
            showToast("Error", "Failed to fetch ledger type entries", "danger");
        }
        finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        apiGet(filters);
    }, [apiGet, filters]);

    const accessDenied = checkPageAccess("Accounts", "Ledger Type"); // ✅ Ensure this submodule is registered or default access is handled
    if (accessDenied) return accessDenied;

    const handleFormSubmit = async (formData: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const data: any = {
                ...formData
            };

            if (editData && editData.ID) {
                data.IDS = editData.ID;
            }

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgerTypeSave`,
                data
            );

            showToast("Success", editData ? "Ledger Type Updated!" : "Ledger Type Saved!", "success");
            setShowForm(false);
            apiGet(filters);
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };

    const handleDelete = async (row: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgerTypeDelete`,
                { IDS: row.ID }
            );

            showToast("Success", "Deleted Successfully", "success");
            apiGet(filters);

        } catch (err) {
            showToast("Error", "Delete Failed", "danger");
        }
    };

    const onAddClick = () => {
        setEditData(null);
        setShowForm(true);
    };

    const handleEdit = (row: any) => {
        setEditData(row);
        setShowForm(true);
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
                    <ListComponent appliedFilters={filters}
                        title="Ledger Type"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={ledgerTypeList}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onAddClick={hasPermission("Accounts", "Ledger Type", "Added") ? onAddClick : undefined}
                        handleEdit={hasPermission("Accounts", "Ledger Type", "Updated") ? handleEdit : undefined}
                        handleDelete={hasPermission("Accounts", "Ledger Type", "Deleted") ? handleDelete : undefined}
                    />
                )}

                <LedgerTypeForm
                    show={showForm}
                    onClose={() => setShowForm(false)}
                    initialData={editData}
                    handleSubmit1={handleFormSubmit}
                />
            </div>
        </div>
    );
};

export default LedgerType;
