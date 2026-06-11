import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import AccountPurchaseFrom from "./AccountPurchaseFrom";
import AccountSearch from "./AccountSearch";
import ListComponent from "../../../components/reuse-components/listComponent";
import AccountLedgerForm from "../ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface BillData {
    BillNo: string;
    Date1: string;
    Names: string;
    "SUM(Amount)": string;
    "SUM(GSTAmount)": string;
    "SUM(Total)": string;
}

type SummaryResponse = BillData[];

const AccountDayBook = () => {
    const accessDenied = checkPageAccess("Accounts", "Purchase Bills");
    if (accessDenied) return accessDenied;

    const [billList, setBillList] = useState<BillData[]>([]);
    const [showLedgerForm, setShowLedgerForm] = useState(false);
    const [show, setShow] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [initialDataExample, setInitialDataExample] = useState<any>([]);
    const [filters, setFilters] = useState<any>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
        Party: "",
    });

    // Table headers mapping
    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Bill No", key: "BillNo", dataType: "string" },
        { label: "Date", key: "Date1", dataType: "string" },
        { label: "Party Name", key: "Names", dataType: "string" },
        { label: "Net Amount", key: "SUM(Amount)", dataType: "number" },
        { label: "GST Amount", key: "SUM(GSTAmount)", dataType: "number" },
        { label: "Total Amount", key: "SUM(Total)", dataType: "number" },
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
                await apiGet();
            } finally {
                setLoading(false);
            }
        };

        loadData();

        return () => {
            document.head.removeChild(style);
        };
    }, [filters]);

    const apiGet = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=PurchaseBills`,
                {
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate,
                    Party: filters.Party,
                }
            );

            setBillList(res.data || []);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        }
        finally {
            setLoading(false);
        }
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
    const handleEdit = async (bill: BillData) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=GetPurchaseBillData`,
                {
                    BillNo: bill.BillNo,
                    Date1: bill.Date1,
                    Party: bill.Names,
                }
            );
            console.log(res.data)
            setInitialDataExample(res.data || [])
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        }
        setShow(true);
    };

    const handleSubmit1 = async (payload: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const table =
                payload.Mode === "EDIT"
                    ? "UpdatePurchaseBill"
                    : "SavePurchaseBill";

            await axios.post(
                `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=${table}`,
                payload
            );

            setShow(false);
            apiGet(); // refresh list
        } catch (err) {
            console.error("Save failed:", err);
        }
    };



    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    const handleSearchSubmit = (formData: Filters) => {
        setAppliedFilters(formData);
        setFilters(formData);
        setShowSearch(false);
    };

    const handleShow = () => {
        setShowSearch(true);
    };

    const onAddClick = () => {
        setShow(true);
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
                    <ListComponent
                        title="Purchase Bills"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={billList}
                        handleEdit={hasPermission("Accounts", "Daybook", "Updated") ? handleEdit : undefined}
                        handleShow={handleShow}
                        appliedFilters={appliedFilters}
                        onAddClick={hasPermission("Accounts", "Daybook", "Added") ? onAddClick : undefined}
                        onAddLedgerClick={hasPermission("Accounts", "Daybook", "Added") ? () => setShowLedgerForm(true) : undefined}
                    />
                )}
                <AccountLedgerForm
                    show={showLedgerForm}
                    onClose={() => setShowLedgerForm(false)}
                    initialData={null}
                    handleSubmit1={handleLedgerSave}
                />

                {/* Form modal */}
                <AccountPurchaseFrom
                    show={show}
                    onClose={() => setShow(false)}
                    handleSubmit1={handleSubmit1}
                    initialData={initialDataExample}
                />

                {/* Search modal */}
                <AccountSearch
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </div>
        </div>
    );
};

export default AccountDayBook;

