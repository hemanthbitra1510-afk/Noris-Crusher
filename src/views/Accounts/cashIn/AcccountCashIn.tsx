import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import CashInSearch from "./cashInSerach";
import CashInForm from "./cashInForm";
import { useToast } from "../../../components/reuse-components/Toast";
import ListComponent from "../../../components/reuse-components/listComponent";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import AccountCashInSummary from "./AccountCashInSummary";
interface ReceiptItem {
    [key: string]: string | number | null | undefined;
    ID: string;
    Date1: string;
    Party: string;
    PaymentMode: string;
    DebitAmount: string;
    Description: string;
}

interface Filters {
    FromDate: string;
    ToDate: string;
    Party: string;
    PaymentMode: string;
}

type SummaryResponse = ReceiptItem[];

const AcccountCashIn = () => {
    const accessDenied = checkPageAccess("Accounts", "Cash In");
    if (accessDenied) return accessDenied;

    const showToast = useToast();
    const [cashInList, setCashInList] = useState<ReceiptItem[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLedgerForm, setShowLedgerForm] = useState(false);
    const [show, setShow] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [editData, setEditData] = useState<any | null>(null);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    const bulkUpdateFields = [
        { label: "Date", key: "Date1", type: "date" as const },
        { label: "Amount", key: "DebitAmount", type: "number" as const },
        { label: "Description", key: "Description", type: "text" as const },
    ];

    const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            await Promise.all(
                ids.map((sid) => {
                    const row = cashInList.find((m) => m.ID === sid);
                    if (!row) return Promise.resolve();
                    return axios.post(
                        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyReceiptsSave`,
                        {
                            ...row,
                            [field]: value,
                            IDS: sid,
                        }
                    );
                })
            );
            showToast("Success", "Bulk update successful", "success");
            setSelectedIds([]);
            apiGet();
        } catch (err) {
            showToast("Error", "Bulk update failed", "danger");
        }
    };
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1", dataType: "string" },
        { label: "Voucher type", key: "Vochure", dataType: "string" },
        { label: "Ledger", key: "Party", dataType: "string" }, // updated
        { label: "Sub Ledger", key: "LedgerFamily", dataType: "string" },
        { label: "Payment Mode", key: "PaymentMode", dataType: "string" },
        { label: "Description", key: "Description", dataType: "string" },
        { label: "Amount", key: "DebitAmount", dataType: "number", type: "number" },
        { label: "Print", key: "print", dataType: "string" }
    ];

    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Party: "",
        PaymentMode: "",
    });

    useEffect(() => {
        apiGet(filters);
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

    const handleSummary = () => {
        setShowSummary(true);
    };

    const handleSearchSubmit = (formData: Filters) => {
        setFilters(formData);
        apiGet(formData);
        setShowSearch(false);
    };
    const handleLedgerSave = async (formData: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const data = {
                ...formData,
                IDS: formData.ID,
            };
            delete data.ID;

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=LedgersRegistration`,
                data
            );

            setShowLedgerForm(false);
            apiGet();
        } catch (err) {
            console.error("Ledger save failed:", err);
        }
    };
    const handleSubmit1 = async (formData: any) => {
        try {

            // 🔥 CLEAN PAYMENT MODE HERE
            const cleanedPaymentMode = formData.PaymentMode
                ?.replace(/\s*\(.*?\)\s*/g, "")  // removes (121)
                ?.trim();

            const data = {
                ...formData,
                PaymentMode: cleanedPaymentMode, // ✅ only bank name
                IDS: formData.ID || editData?.ID || ""
            };

            delete data.ID;

            console.log(data);

            const id = sessionStorage.getItem("selectedItems") ?? "";
            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyReceiptsSave`,
                data
            );
            showToast("Success", "Ledger Saved!", "success");
            setShow(false);
            apiGet();
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };
    const apiGet = async (filterData?: Filters) => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.post<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyReceipts`,
                filterData || {}
            );

            setCashInList(res.data || []);
        } catch (err) {
            console.error("Error fetching cash-in data:", err);
        }
        finally {
            setLoading(false);
        }
    };
    const onAddClick = () => {
        setEditData(null);
        setShow(true);
    };

    const periodOptions = ["All", "This Month", "Last Month", "This Year"];
    const handlePrint = (row: ReceiptItem) => {
        const printWindow = window.open("", "_blank");

        if (!printWindow) return;

        const content = `
    <html>
    <head>
        <title>Receipt</title>
        <style>
            body {
                font-family: Arial;
                padding: 20px;
                width: 300px;
            }
            h3 {
                text-align: center;
                margin-bottom: 10px;
            }
            .line {
                border-bottom: 1px dashed #000;
                margin: 10px 0;
            }
            .right {
                text-align: right;
                font-weight: bold;
            }
        </style>
    </head>
    <body>

        <h3>RECEIPT</h3>
        <div class="line"></div>

        <p><b>Date:</b> ${row.Date1}</p>
        <p><b>Voucher:</b> ${row.Vochure || ""}</p>
        <p><b>Party:</b> ${row.Party}</p>
        <p><b>Sub Ledger:</b> ${row.LedgerFamily || ""}</p>
        <p><b>Payment Mode:</b> ${row.PaymentMode}</p>

        <div class="line"></div>

        <p><b>Description:</b> ${row.Description}</p>

        <h3 class="right">₹ ${row.DebitAmount}</h3>

        <div class="line"></div>
        <p style="text-align:center;">Thank You</p>

    </body>
    </html>
    `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
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
                    <ListComponent appliedFilters={filters}
                        title="Cash In - Party Receipts"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={cashInList.map((row) => ({
                            ...row,
                            print: (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handlePrint(row)}
                                >
                                    Print
                                </button>
                            )
                        }))}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        bulkUpdateFields={bulkUpdateFields}
                        onBulkUpdateSave={handleBulkUpdateSave}
                        onAddClick={hasPermission("Accounts", "Cash In", "Added") ? onAddClick : undefined}
                        handleShow={() => setShowSearch(true)}
                        onAddLedgerClick={hasPermission("Accounts", "Cash In", "Added") ? () => setShowLedgerForm(true) : undefined}
                        handleEdit={hasPermission("Accounts", "Cash In", "Updated") ? (row) => {
                            setEditData(row);
                            setShow(true);
                        } : undefined}

                        handleDelete={hasPermission("Accounts", "Cash In", "Deleted") ? async (row) => {
                            try {
                                const id = sessionStorage.getItem("selectedItems") ?? "";

                                await axios.post(
                                    `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PartyReceiptsDelete`,
                                    { IDS: row.ID }
                                );

                                showToast("Success", "Deleted Successfully", "success");
                                apiGet();

                            } catch (err) {
                                showToast("Error", "Delete Failed", "danger");
                            }
                        } : undefined}

                        handleSummary={handleSummary}

                    />
                )}
                <AccountLedgerForm
                    show={showLedgerForm}
                    onClose={() => setShowLedgerForm(false)}
                    initialData={null}
                    handleSubmit1={handleLedgerSave}
                />
                <CashInSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
                <CashInForm
                    show={show}
                    onClose={() => setShow(false)}
                    initialData={editData}
                    handleSubmit1={handleSubmit1}
                />
                <AccountCashInSummary
                    show={showSummary}
                    onClose={() => setShowSummary(false)}
                    data={cashInList}
                />
            </div>
        </div>
    );
};

export default AcccountCashIn;