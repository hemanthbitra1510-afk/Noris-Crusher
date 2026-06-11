import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import QuarryForm from "./contractorForm";
import { Offcanvas, OffcanvasBody, OffcanvasHeader } from "react-bootstrap";
import BlukImport from "../../../components/reuse-components/blukImportOffCanvas";
import ExcelUpload from "../../../components/reuse-components/exaclFileUpload";
import AccountLedgerForm from "../../Accounts/ledger/AccountLedgerFrom";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";

interface DashboardListRow {
    [key: string]: string | number | null | undefined;
}

interface DebitorDeal extends DashboardListRow {
    ID: number;
    QuarryName: string;
    Extractor: string;
    Rate: string;
    Date1: string;
    Payable: number;   // ✅ NEW
    Paid: number;
}


type SummaryResponse = DebitorDeal[];

const ContractorList = () => {
    const [materialTop, setMaterialTop] = useState<DebitorDeal[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLedgerForm, setShowLedgerForm] = useState(false);

    const [editData, setEditData] = useState<DebitorDeal | null>(null);
    const [isEdit, setIsEdit] = useState(false);


    // Excel upload modal
    const [showExcelModal, setShowExcelModal] = useState(false);

    // Offcanvas for preview
    const [showImport, setShowImport] = useState(false);

    // Excel JSON + dynamic headers
    const [excelData, setExcelData] = useState<any[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);

    const accessDenied = checkPageAccess("Quarry", "Contractor");

    const showToast = useToast();

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "Date1" },
        { label: "Quarry", key: "QuarryName" },
        { label: "Contractor", key: "Extractor" },
        { label: "Rate", key: "Rate" },
        { label: "Payable", key: "Payable", dataType: "number" },
        { label: "Paid", key: "Paid", dataType: "number" },
        { label: "Balance", key: "Balance", dataType: "number", showTotal: false },
    ];

    useEffect(() => {
        if (accessDenied) return;
        apiGet();
    }, [accessDenied]);
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


    // Fetch API data
    const apiGet = async () => {
        try {
            setLoading(true);

            const id = sessionStorage.getItem("selectedItems") ?? "";

            const res = await axios.get<SummaryResponse>(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=QuarryLease`
            );

            setMaterialTop(res.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
            setMaterialTop([]);
        } finally {
            setTimeout(() => {
                setLoading(false); // smooth UX
            }, 300);
        }
    };

    // Add Quarry
    const handleSave = async (formData: Partial<DebitorDeal>) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";

            await axios.post(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryLease`,
                {
                    ...formData,
                    IDS: isEdit ? editData?.ID : undefined, // ✅ ONLY for edit
                }
            );

            showToast(
                "Success",
                isEdit ? "Updated successfully!" : "Saved successfully!",
                "success"
            );

            setLoading(true);   // ✅ ADD
            await apiGet();
            setShowModal(false);
            setEditData(null);
            setIsEdit(false);
        } catch {
            showToast("Error", "Something went wrong.", "danger");
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
            setShowLedgerForm(false);
            apiGet();
        } catch (err) {
            showToast("Error", "Something went wrong. Please try again.", "danger");
        }
    };

    // Open Add Modal
    const handleAddClick = () => setShowModal(true);

    // Edit placeholder
    const handleEdit = (deal: DebitorDeal) => {
        setEditData(deal);
        setIsEdit(true);
        setShowModal(true);
    };


    // Open Excel upload modal
    const handleImport = () => setShowExcelModal(true);

    // Delete API
    const handleDelete = async (deal: DebitorDeal) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            await axios.post(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=DeleteQuarryLease`,
                { IDS: deal.ID, _method: "DELETE" }
            );

            showToast("Success", "Deleted successfully!", "success");
            setLoading(true);   // ✅ ADD
            await apiGet();
        } catch (err) {
            showToast("Error", "Something went wrong.", "danger");
        }
    };

    // Excel Upload → Save JSON → Open Offcanvas
    const handleExcelSubmit = (data: any[]) => {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            setExcelHeaders(keys);
            setExcelData(data);
            setShowImport(true); // open preview offcanvas
        }
        setShowExcelModal(false);
    };
    const uploadBulk = async (rows: any[]) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            await axios.post(
                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryLeaseBatch`,
                rows
            );
            showToast("Success", "Bulk import saved!", "success");
            setShowImport(false);
            apiGet();
        } catch (err) {
            console.error(err);
            showToast("Error", "Upload failed", "danger");
        }
    };
    // handleAddLedgerClick removed

    // Bulk update removed

    if (accessDenied) return accessDenied;

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
                        title="Quarry Contractor"
                        periodOptions={["All", "This Month", "Last Month", "This Year"]}
                        tableHeaders={headers as any}
                        dealsData={materialTop}
                        mainModule="Quarry"
                        subModule="Contractor"
                        onSelectionChange={undefined}
                        onBulkUpdateSave={undefined}
                        onAddClick={hasPermission("Quarry", "Contractor", "Added") ? handleAddClick : undefined}
                        handleEdit={hasPermission("Quarry", "Contractor", "Updated") ? (deal) => handleEdit(deal as any) : undefined}
                        loading={loading}
                        handleImport={handleImport}
                        handleDelete={hasPermission("Quarry", "Contractor", "Deleted") ? (deal) => handleDelete(deal as any) : undefined}
                        onAddLedgerClick={hasPermission("Quarry", "Contractor", "Added") ? () => setShowLedgerForm(true) : undefined}
                        onSuccess={apiGet}
                        onBulkUpload={hasPermission("Quarry", "Contractor", "Added") ? async (data: any[]) => {
                            const id = sessionStorage.getItem("selectedItems") ?? "";
                            await axios.post(
                                `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=SaveQuarryLeaseBatch`,
                                data
                            );
                        } : undefined}
                    />
                )}
            </div>


            {/* Add Ledger Modal */}
            <AccountLedgerForm
                show={showLedgerForm}
                onClose={() => setShowLedgerForm(false)}
                initialData={null}
                handleSubmit1={handleSubmit1}
            />

            {/* Add Quarry Modal */}
            <QuarryForm
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setEditData(null);
                    setIsEdit(false);
                }}
                onSubmit={(formData: any) => handleSave(formData)}
                initialData={editData || undefined}
                isEdit={isEdit}
            />


            {/* Excel Upload Modal */}
            <ExcelUpload
                show={showExcelModal}
                onHide={() => setShowExcelModal(false)}
                onSubmit={handleExcelSubmit}
            />

            {/* Offcanvas Bulk Import Preview */}
            <Offcanvas
                show={showImport}
                onHide={() => setShowImport(false)}
                placement="end"
                style={{ width: "auto" }}
            >
                <OffcanvasHeader closeButton>
                    <div>
                        <h5 className="mb-0 text-primary">Bulk Import - Quarry Contractor</h5>
                        <small className="text-muted">Preview Imported Excel Data</small>
                    </div>
                </OffcanvasHeader>

                <OffcanvasBody>
                    <BlukImport
                        tableHeaders={excelHeaders.map(h => ({ label: h, key: h }))}
                        dealsData={excelData}
                        onUpload={(rows) => {
                            console.log("Selected rows:", rows);
                            uploadBulk(rows);
                        }}
                    />
                </OffcanvasBody>
            </Offcanvas>
        </div>
    );
};

export default ContractorList;

