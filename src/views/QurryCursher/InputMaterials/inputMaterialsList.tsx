import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import InputMaterialsSearch from "./inputMaterialsSearch";
import moment from "moment";
import { Offcanvas, Button } from "react-bootstrap";
import SummaryOffcanvas from "./summaryList";

interface InputMaterial {
    ID: number;
    DCNumber: string;
    Vehicle: string;
    Party: string;
    SubParty: string;
    Material: string;
    Gross: string;
    Tare: string;
    Nett: string;
    Deduction: string;
    FinalWeight: string;
    Charges: string;
    Typed?: string;
    [key: string]: string | number | null | undefined;
}

const InputMaterialsList = () => {
    const [data, setData] = useState<InputMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [filters, setFilters] = useState({
        Vehicle: "",
        Material: "",
        Party: "",
        FromDate: "01-02-2025",
        ToDate: moment().format("DD-MM-YYYY"),
    });

    // --- State for Edit Offcanvas ---
    const [showEdit, setShowEdit] = useState(false);
    const [editRow, setEditRow] = useState<InputMaterial | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- State for Image View Offcanvas ---
    const [showImageCanvas, setShowImageCanvas] = useState(false);
    const [imageList, setImageList] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);

    // --- State for Summary Offcanvas ---
    const [summaryCan, setSummaryCan] = useState(false);

    const showToast = useToast();

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Date", key: "GrossDate" },
        { label: "DC Number", key: "DCNumber" },
        { label: "Vehicle", key: "Vehicle" },
        { label: "Party", key: "Party" },
        { label: "Unloading", key: "SubParty" },
        { label: "Material", key: "Material" },
        { label: "Gross", key: "Gross", dataType: "number" },
        { label: "Tare", key: "Tare", dataType: "number" },
        { label: "Nett", key: "Nett", dataType: "number" },
        { label: "Mositure", key: "Charges", dataType: "number" },
        { label: "Deduction", key: "Deduction", dataType: "number" },
        { label: "Final Weight", key: "FinalWeight", dataType: "number" },
        { label: "Royality", key: "Royality" },
        { label: "View", key: "viewAction" },
    ];

    useEffect(() => {
        apiGet();
    }, [filters]);

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

    const apiGet = async () => {
        try {
            setLoading(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const payload = {
                "Vehicle": filters.Vehicle,
                "Material": filters.Material,
                "Party": filters.Party,
                "FromDate": filters.FromDate,
                "ToDate": filters.ToDate
            };

            const res = await axios.post<InputMaterial[]>(
                `https://norisapi.noris.in/Crusher/InputMaterial.php?ID=${id}&TableName=MyInputMaterials`,
                payload
            );

            setData(res.data || []);
        } catch (err) {
            console.error("Fetch Error:", err);
            setData([]);
            showToast("Error", "Failed to fetch Input Materials.", "danger");
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 300);
        }
    };

    const handleSearchSubmit = (formData: any) => {
        setFilters({
            Vehicle: formData.Vehicle,
            Material: formData.Material,
            Party: formData.Party,
            FromDate: moment(formData.FromDate).format("DD-MM-YYYY"),
            ToDate: moment(formData.ToDate).format("DD-MM-YYYY"),
        });
        setShowSearch(false);
    };

    // --- Handler for Edit ---
    const handleEdit = (row: any) => {
        setEditRow({ ...row });
        setShowEdit(true);
    };

    // --- Handler for View (Images) ---
    const handleView = async (row: any) => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            if (!id || !row?.ID) return;

            setImageLoading(true);
            setImageList([]);
            setShowImageCanvas(true);

            // Fetch images - using a likely TableName based on common patterns
            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/InputMaterial.php?ID=${id}&TableName=MyInputMaterialsImage`,
                {
                    IDS: row.ID,
                    Typed: row.Typed || "InputMaterial",
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
                            if (padding !== 0) base64 += "=".repeat(4 - padding);
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
            setImageLoading(false);
        }
    };

    const renderCell = (value: any, _row: any, key: string) => {
        if (key === "viewAction") {
            return value;
        }
        return value;
    };

    // --- Handler for Save (Update) ---
    const handleUpdate = async () => {
        if (!editRow) return;
        try {
            setIsSaving(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            // Using TableName=UpdateWeighmentRecord as it's common in this app
            await axios.post(
                `https://norisapi.noris.in/Crusher/InputMaterial.php?ID=${id}&TableName=UpdateWeighmentRecord`,
                {
                    ...editRow,
                    IDS: editRow.ID,
                    Typed: editRow.Typed || "InputMaterial"
                }
            );

            showToast("Success", "Record updated successfully", "success");
            setShowEdit(false);
            apiGet();
        } catch (err) {
            console.error("Update Error:", err);
            showToast("Error", "Failed to update record.", "danger");
        } finally {
            setIsSaving(false);
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
                        <div style={{ position: "relative", width: 150, height: 150 }}>
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
                                    width: 55,
                                    height: 55,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <ListComponent
                            title="Input Materials"
                            periodOptions={["All", "This Month", "Last Month", "This Year"]}
                            tableHeaders={headers as any}
                            dealsData={data.map((row) => ({
                                ...row,
                                viewAction: (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleView(row)}
                                    >
                                        View
                                    </button>
                                )
                            }))}
                            mainModule="Quarry"
                            subModule="Input material"
                            onSelectionChange={undefined}
                            onBulkUpdateSave={undefined}
                            loading={loading}
                            onSuccess={apiGet}
                            handleShow={() => setShowSearch(true)}
                            handleSummary={() => setSummaryCan(true)}
                            // handleEdit={handleEdit}
                            handleView={undefined}
                            customCellRenderer={renderCell}
                            onBulkUpload={async (data: any[]) => {
                                const id = sessionStorage.getItem("selectedItems") ?? "";
                                for (const item of data) {
                                    try {
                                        await axios.post(
                                            `https://norisapi.noris.in/Crusher/InputMaterial.php?ID=${id}&TableName=UpdateWeighmentRecord`,
                                            {
                                                ...item,
                                                Typed: "InputMaterial"
                                            }
                                        );
                                    } catch (err) {
                                        console.error("Bulk upload error:", err);
                                    }
                                }
                            }}
                        />

                        <InputMaterialsSearch
                            show={showSearch}
                            handleClose={() => setShowSearch(false)}
                            handleSubmit={handleSearchSubmit}
                        />

                        <SummaryOffcanvas
                            show={summaryCan}
                            onClose={() => setSummaryCan(false)}
                            data={data}
                        />

                        {/* --- Edit Offcanvas --- */}
                        <Offcanvas show={showEdit} onHide={() => setShowEdit(false)} placement="end" style={{ width: '40%' }}>
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title>Edit Input Material</Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body>
                                {editRow && (
                                    <div className="row g-3">
                                        <div className="col-md-12">
                                            <label className="form-label">Vehicle</label>
                                            <input className="form-control" value={editRow.Vehicle || ""} disabled />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Gross</label>
                                            <input className="form-control" type="number" value={editRow.Gross || ""} onChange={(e) => setEditRow({ ...editRow, Gross: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Tare</label>
                                            <input className="form-control" type="number" value={editRow.Tare || ""} onChange={(e) => setEditRow({ ...editRow, Tare: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Deduction</label>
                                            <input className="form-control" type="number" value={editRow.Deduction || ""} onChange={(e) => setEditRow({ ...editRow, Deduction: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Charges</label>
                                            <input className="form-control" type="number" value={editRow.Charges || ""} onChange={(e) => setEditRow({ ...editRow, Charges: e.target.value })} />
                                        </div>
                                        <div className="col-md-12 mt-4 text-end">
                                            <Button variant="secondary" className="me-2" onClick={() => setShowEdit(false)}>Cancel</Button>
                                            <Button variant="primary" onClick={handleUpdate} disabled={isSaving}>
                                                {isSaving ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Offcanvas.Body>
                        </Offcanvas>

                        {/* --- Image View Offcanvas --- */}
                        <Offcanvas show={showImageCanvas} onHide={() => setShowImageCanvas(false)} placement="end" style={{ width: '50%' }}>
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title>Images</Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body>
                                {imageLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status"></div>
                                        <p className="mt-2 text-muted">Loading images...</p>
                                    </div>
                                ) : imageList.length > 0 ? (
                                    <div className="d-flex flex-column gap-3">
                                        {imageList.map((img, idx) => (
                                            <img key={idx} src={`data:image/jpeg;base64,${img}`} alt={`Record Image ${idx + 1}`} className="img-fluid rounded shadow-sm border" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="ti ti-photo-off fs-1 d-block mb-2"></i>
                                        No images found for this record.
                                    </div>
                                )}
                            </Offcanvas.Body>
                        </Offcanvas>
                    </>
                )}
            </div>
        </div>
    );
};

export default InputMaterialsList;
