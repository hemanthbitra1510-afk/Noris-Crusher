
import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import ContraSearch from "./ContraSearch";
import ContraForm from "./ContraForm";
import { useToast } from "../../../components/reuse-components/Toast";
import ListComponent from "../../../components/reuse-components/listComponent";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface ContraItem {
    [key: string]: string | number | null | undefined;
    ID: string;
    Date1: string;
    FromBank: string;
    ToBank: string;
    Amount: string;
    Description: string;
}

interface Filters {
    FromDate: string;
    ToDate: string;
    Bank: string;
}

const AccountContra = () => {
    const showToast = useToast();
    const [contraList, setContraList] = useState<ContraItem[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState<any | null>(null);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1", dataType: "string" },
        { label: "From Bank", key: "FromBank", dataType: "string" },
        { label: "To Bank", key: "ToBank", dataType: "string" },
        { label: "Amount", key: "Amount", dataType: "number", type: "number" },
        { label: "Description", key: "Description", dataType: "string" },
    ];

    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Bank: "",
    });

    const apiGet = useCallback(async (filterData?: Filters) => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=ContraDetails`,
                filterData || {}
            );

            setContraList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching contra data:", err);
            showToast("Error", "Failed to fetch contra entries", "danger");
        }
        finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        apiGet(filters);
    }, [apiGet, filters]);

    const accessDenied = checkPageAccess("Accounts", "Contra");
    if (accessDenied) return accessDenied;

    const handleSearchSubmit = (formData: Filters) => {
        const cleanName = (name: string) => name?.replace(/\s*\(.*?\)\s*/g, "").trim();
        const cleanedData = {
            ...formData,
            Bank: cleanName(formData.Bank)
        };
        setAppliedFilters(formData);
        setFilters(formData); // Keep original for UI if needed
        apiGet(cleanedData);
        setShowSearch(false);
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const cleanName = (name: string) => name?.replace(/\s*\(.*?\)\s*/g, "").trim();

            const data = {
                ...formData,
                FromBank: cleanName(formData.FromBank),
                ToBank: cleanName(formData.ToBank),
                IDS: formData.IDS || ""
            };

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=ContraSave`,
                data
            );

            showToast("Success", editData ? "Contra Updated!" : "Contra Saved!", "success");
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
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=ContraDelete`,
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
                    <ListComponent
                        title="Contra - Internal Transfers"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={contraList}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onAddClick={hasPermission("Accounts", "Contra", "Added") ? onAddClick : undefined}
                        handleShow={() => setShowSearch(true)}
                        appliedFilters={appliedFilters}
                        handleEdit={hasPermission("Accounts", "Contra", "Updated") ? handleEdit : undefined}
                        handleDelete={hasPermission("Accounts", "Contra", "Deleted") ? handleDelete : undefined}
                    />
                )}

                <ContraSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleSubmit={handleSearchSubmit}
                />

                <ContraForm
                    show={showForm}
                    onClose={() => setShowForm(false)}
                    initialData={editData}
                    handleSubmit1={handleFormSubmit}
                />
            </div>
        </div>
    );
};

export default AccountContra;
