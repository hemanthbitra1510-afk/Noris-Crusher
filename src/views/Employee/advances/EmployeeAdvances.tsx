import { useState, useEffect, useCallback } from "react";
import ListComponent from "../../../components/reuse-components/listComponent";
import axios from "axios";
import ModalAdvanceEmployee from "./ModalAdvanceEmployee";
import AdvanceSearch from "./AdvanceSearch";
import { useToast } from "../../../components/reuse-components/Toast";
import { checkPageAccess } from "../../../utils/permission";

const EmployeeAdvances = () => {
    const accessDenied = checkPageAccess("Employee", "Advances");
    if (accessDenied) return accessDenied;

    const [dealsData, setDealsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
    const [filters, setFilters] = useState({
        Employee: "",
        FromDate: "",
        ToDate: ""
    });
    const showToast = useToast();

    const fetchAdvances = useCallback(async (searchFilters = filters) => {
        setLoading(true);
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${id}&TableName=MyEmployeeAdvanceShow`,
                searchFilters
            );
            if (Array.isArray(res.data)) {
                setDealsData(res.data);
            } else {
                setDealsData([]);
            }
        } catch (error) {
            console.error("Failed to fetch advances:", error);
            setDealsData([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAdvances();
    }, [fetchAdvances]);

    const handleSearchSubmit = (searchData: any) => {
        setFilters(searchData);
        fetchAdvances(searchData);
        setShowSearch(false);
    };

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1", dataType: "date" },
        { label: "Employee Name", key: "Names", dataType: "string" },
        { label: "Mode", key: "Bank", dataType: "string" },
        { label: "Amount", key: "DebitAmount", dataType: "number" },
        { label: "Description", key: "Particular", dataType: "string" },
    ];

    const onAddClick = () => {
        setSelectedAdvance(null);
        setShowModal(true);
    };

    const handleEdit = (row: any) => {
        setSelectedAdvance(row);
        setShowModal(true);
    };

    const handleDelete = async (row: any) => {
        if (window.confirm("Are you sure you want to delete this advance record?")) {
            try {
                const id = sessionStorage.getItem("selectedItems") ?? "";
                await axios.post(
                    `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyPaymentsDelete`,
                    { IDS: row.ID1 }
                );
                showToast("Success", "Advance record deleted successfully!", "success");
                fetchAdvances();
            } catch (error) {
                console.error("Failed to delete advance:", error);
                showToast("Error", "Failed to delete advance record.", "danger");
            }
        }
    };

    const handleSuccess = () => {
        fetchAdvances();
    };

    return (
        <div className="page-wrapper">
            <div className="content p-2">
                <ListComponent
                    title="Employee Advances List"
                    periodOptions={["All", "This Month", "Last Month", "This Year"]}
                    tableHeaders={headers as any}
                    dealsData={dealsData}
                    loading={loading}
                    onAddClick={onAddClick}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    onSuccess={handleSuccess}
                    handleShow={() => setShowSearch(true)}
                />
            </div>

            <AdvanceSearch
                show={showSearch}
                handleClose={() => setShowSearch(false)}
                handleSubmit={handleSearchSubmit}
            />

            <ModalAdvanceEmployee
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                initialData={selectedAdvance}
            />
        </div>
    );
};

export default EmployeeAdvances;
