import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import { useToast } from "../../../components/reuse-components/Toast";
import AccountLedgerForm from "./AccountLedgerFrom";
// Ledger type interface
interface Ledger {
    Party: string;
    Type: string;
    ID: string;
    Status: string;
    [key: string]: any;
}

const AccountLedgerList = () => {
    const showToast = useToast();
    const [ledgerData, setLedgerData] = useState<Ledger[]>([]);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [editData, setEditData] = useState<Ledger | null>([]);

    const accessDenied = checkPageAccess("Accounts", "Ledger Creation");

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Ledger", key: "Party", dataType: "string" },
        { label: "Type", key: "Type", dataType: "string" },
        { label: "Status", key: "Status", dataType: "string" },
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
                if (accessDenied) return;
                await apiGet();
            } finally {
                setLoading(false);
            }
        };

        loadData();

        return () => {
            document.head.removeChild(style);
        };
    }, [accessDenied]);

    const apiGet = async () => {

        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
            );
            setLedgerData(res.data || []);
        } catch (err) {
            console.error("Error fetching data:", err);
            showToast("Error", "Failed to fetch ledgers", "danger");
        }
        finally {
            setLoading(false);
        }
    };

    const onAddClick = () => {
        setEditData(null);
        setShow(true);
    };

    const handleEdit = async (ledger: Ledger) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgersID`,
                { IDS: ledger.ID }
            );
            const data = {
                ...res.data[0],
                PartyName: res.data[0].Party,
                GSTin: res.data[0].GST,
                Limit: res.data[0].Credit,
                Date: res.data[0].BalanceDate,
                Email: res.data[0].Email
            }
            setEditData(data || []);
            setShow(true);
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };

    const handleSubmit1 = async (formData: any) => {
        try {
            const data = {
                ...formData,
                IDS: formData.ID
            }
            delete data.ID
            console.log(data)
            const id = sessionStorage.getItem("selectedItems") ?? "";
            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
                data
            );
            showToast("Success", "Ledger Saved!", "success");
            setShow(false);
            await apiGet();
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };

    const handleDelete = async (formData: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const data = {
                IDS: formData.ID,
                Type: formData.Type,
                _method: "DELETE"
            }
            console.log(data)
            await axios.post(
                `http://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgersDelete`,
                data
            );
            showToast("Success", "Login deleted!", "success");
            await apiGet();
        } catch (err) {
            console.error("Error deleting source:", err);
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };


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
                    <ListComponent
                        title="Account Ledger List"
                        periodOptions={["All", "This Month", "Last Month", "This Year"]}
                        onAddClick={hasPermission("Accounts", "Ledger Creation", "Added") ? onAddClick : undefined}
                        tableHeaders={headers}
                        dealsData={ledgerData}
                        handleEdit={hasPermission("Accounts", "Ledger Creation", "Updated") ? handleEdit : undefined}
                        handleDelete={hasPermission("Accounts", "Ledger Creation", "Deleted") ? handleDelete : undefined}
                        onSuccess={apiGet}
                    />
                )}
                <AccountLedgerForm
                    show={show}
                    onClose={() => setShow(false)}
                    initialData={editData}
                    handleSubmit1={handleSubmit1}
                />
            </div>
        </div>
    );
};

export default AccountLedgerList;
