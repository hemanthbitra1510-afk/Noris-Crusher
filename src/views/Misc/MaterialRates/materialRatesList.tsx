import { useEffect, useState } from "react";
import axios from "axios";
import ListComponent from "../../../components/reuse-components/listComponent";
import { useToast } from "../../../components/reuse-components/Toast";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
import MaterialRatesSearch from "./materialRatesSearch";

interface MaterialRate {
    ID: string;
    Party: string;
    Material: string;
    UnitRate: string;
    Units: string;
    Status: string;
    HSNCode: string;
    Tax: string;
    IMIE: string;
    [key: string]: string | number | null | undefined;
}

const MaterialRatesList = () => {
    const [data, setData] = useState<MaterialRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [filters, setFilters] = useState({
        Party: "",
        Material: "",
    });

    const showToast = useToast();

    const headers = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Party", key: "Party" },
        { label: "Material", key: "Material" },
        { label: "Unit Rate", key: "UnitRate", dataType: "number" },
        { label: "Units", key: "Units" },
        { label: "Status", key: "Status" },
        { label: "Tax", key: "Tax", dataType: "number" },
    ];

    const bulkUpdateFields = [
        { label: "Unit Rate", key: "UnitRate", type: "number" as const },
        { label: "Units", key: "Units", type: "text" as const },
        { label: "Status", key: "Status", type: "text" as const },
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

            // The API provided uses GET with ID and TableName
            const res = await axios.get<MaterialRate[]>(
                `https://norisapi.noris.in/Crusher/Misc.php?ID=${id}&TableName=MaterialRates`
            );

            let result = res.data || [];

            // Apply simple local filtering if needed
            if (filters.Party) {
                result = result.filter(item => item.Party === filters.Party);
            }
            if (filters.Material) {
                result = result.filter(item => item.Material === filters.Material);
            }

            setData(result);
        } catch (err) {
            console.error("Fetch Error:", err);
            setData([]);
            showToast("Error", "Failed to fetch Material Rates.", "danger");
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 300);
        }
    };

    const handleSearchSubmit = (formData: any) => {
        setFilters(formData);
        setShowSearch(false);
    };

    const handleBulkUpdateSave = async (field: string, value: any, ids: (string | number)[]) => {
        try {
            setIsSaving(true);
            const id = sessionStorage.getItem("selectedItems") ?? "";

            const updatePromises = ids.map(recordId => {
                const record = data.find(d => String(d.ID) === String(recordId));
                if (!record) return Promise.resolve();

                // Construct payload: ID, TableName=UpdateMaterialRates (assumed)
                // and the fields for update. Usually we send the whole record with updated field.
                return axios.post(
                    `https://norisapi.noris.in/Crusher/Misc.php?ID=${id}&TableName=UpdateMaterialRates`,
                    {
                        ...record,
                        IDS: recordId, // Backend often expects IDS for the row being updated
                        [field]: value
                    }
                );
            });

            await Promise.all(updatePromises);
            showToast("Success", `Successfully updated ${ids.length} records.`, "success");
            setSelectedIds([]);
            apiGet();
        } catch (err) {
            console.error("Bulk Update Error:", err);
            showToast("Error", "Failed to update some records.", "danger");
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
                            title="Material Rates"
                            periodOptions={["All"]}
                            tableHeaders={headers as any}
                            dealsData={data}
                            mainModule="Misc"
                            subModule="Material Rates"
                            onSelectionChange={setSelectedIds}
                            selectedIds={selectedIds}
                            bulkUpdateFields={bulkUpdateFields}
                            onBulkUpdateSave={handleBulkUpdateSave}
                            loading={loading || isSaving}
                            onSuccess={apiGet}
                            handleShow={() => setShowSearch(true)}
                        />

                        <MaterialRatesSearch
                            show={showSearch}
                            handleClose={() => setShowSearch(false)}
                            handleSubmit={handleSearchSubmit}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default MaterialRatesList;
