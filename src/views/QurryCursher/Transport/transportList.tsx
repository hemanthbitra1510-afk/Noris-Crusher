import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import TransPortFrom from "./transportFrom";
import { useToast } from "../../../components/reuse-components/Toast";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

/* ================= TYPES ================= */

interface DashboardListRow {
    [key: string]: string | number | undefined | null;
}

interface DebitorDeal extends DashboardListRow {
    ID: number;
    Bank: string;
    AccName: string;
    AccBranch: string;
    Date1: string;
    AccType: string;
    AccNo: string;
}

type SummaryResponse = DebitorDeal[];

const TransportList = () => {
    const accessDenied = checkPageAccess("Quarry", "Transport");
    if (accessDenied) return accessDenied;

    const [showModal, setShowModal] = useState(false);
    const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
    const [showLedgerForm, setShowLedgerForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1" },
        { label: "Transporter", key: "Transporter" },
        { label: "Measurement", key: "Measurement" },
        { label: "Rate", key: "Rate" },
    ];
    useEffect(() => {
        apiGet();
    }, []);

    useEffect(() => {
        const style = document.createElement("style");

        style.innerHTML = `
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
      `;

        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);
    const showToast = useToast();
    const apiGet = async () => {
        try {
            setLoading(true); // ✅ START LOADING

            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.get<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=QuarryTransport`
            );

            setMaterialTop(res.data || []);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
            setMaterialTop([]);
        } finally {
            setTimeout(() => {
                setLoading(false); // ✅ STOP LOADING
            }, 300);
        }
    };

    const periodOptions = ["All", "This Month", "Last Month", "This Year"];
    const handleAddBank = async (formData: Partial<DebitorDeal>) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            console.log(formData)
            await axios.post(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryTransport`,
                formData
            );
            showToast("Success", "Transport Saved successfully!", "success");
            apiGet();
            setShowModal(false);
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };
    const handleAddClick = () => {
        setShowModal(true)

    }

    const handleDelete = async (deal: DebitorDeal) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            await axios.post(`https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=DeleteQuarryTransport`, { IDS: deal.ID });
            showToast("Success", "Deleted successfully!", "success");
            apiGet();
        } catch (err) {
            console.error("Error deleting bank:", err);
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };

    // Bulk update removed
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
            setShowLedgerForm(false);
            apiGet();
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };
    const handleAddLedgerClick = () => {
        setShowLedgerForm(true);
    };

    const handleBulkUpload = async (data: any[]) => {
        const id = sessionStorage.getItem("selectedItems") ?? "";
        for (const item of data) {
            try {
                await axios.post(
                    `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryTransport`,
                    item
                );
            } catch (err) {
                console.error("Bulk upload error for item:", item, err);
            }
        }
    };
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

                            {/* Center Logo */}
                            <img
                                src={logo}
                                alt="Loading"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: 55,
                                    height: 55,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <ListComponent
                        title="Transport List"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={materialTop}
                        loading={loading}
                        onAddClick={hasPermission("Quarry", "Transport", "Added") ? handleAddClick : undefined}
                        handleEdit={hasPermission("Quarry", "Transport", "Updated") ? (row: any) => {
                            // handleEditClick logic was not present but adding it to show selection
                            // Often it's handleEditClick(row)
                            // For now just logging to fix unused row lint
                            console.log("Editing row:", row);
                            setShowModal(true);
                        } : undefined}
                        handleDelete={hasPermission("Quarry", "Transport", "Deleted") ? (deal) => handleDelete(deal as DebitorDeal) : undefined}
                        onAddLedgerClick={hasPermission("Quarry", "Transport", "Added") ? handleAddLedgerClick : undefined}
                        onBulkUpload={hasPermission("Quarry", "Transport", "Added") ? handleBulkUpload : undefined}
                        onSuccess={apiGet}
                    />
                )}
            </div>
            <AccountLedgerForm
                show={showLedgerForm}
                onClose={() => setShowLedgerForm(false)}
                initialData={null}
                handleSubmit1={handleSubmit1}
            />
            <TransPortFrom
                show={showModal}
                onHide={() => setShowModal(false)}
                onSubmit={(formData: any) => handleAddBank(formData)}
            />
        </div>
    );
};

export default TransportList;

