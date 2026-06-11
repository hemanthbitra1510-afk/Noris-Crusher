import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import ProductionList from "../../../components/reuse-components/productionList";
import { Offcanvas, OffcanvasBody, OffcanvasHeader } from "react-bootstrap";
import MaintainaceReportSerach from "./MaintainaceReportSerach";
// ✅ Interface for each maintenance record (based on the structure you provided)
interface MaintenanceRecord {
    Date1: string;
    Time1: string;
    Material: string;
    Description: string;
    Qty: string;
    Rate: string;
    Amount: string;
}

// ✅ Interface for search filter
interface Filters {
    FromDate: string;
    ToDate: string;
}

// ✅ Props for the MaintainaceReport component
interface MaintainaceReportProps {
    show: boolean;
    onClose: () => void;
    data: { Vehicle: string };
    parentFilters?: Filters;
}

const MaintainaceReport = ({ show, onClose, data, parentFilters }: MaintainaceReportProps) => {
    const accessDenied = checkPageAccess("Vehicle", "Maintainance");
    if (accessDenied) return accessDenied;

    const [materialTop, setMaterialTop] = useState<MaintenanceRecord[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        FromDate: moment().subtract(6, "days").format("YYYY-MM-DD"),
        ToDate: moment().format("YYYY-MM-DD"),
    });

    // Sync filters with parent filters when the report modal is opened
    useEffect(() => {
        if (show && parentFilters) {
            setFilters(parentFilters);
        }
    }, [show, parentFilters]);

    // ✅ Define table headers
    const headers = [

        { label: "Date", key: "Date1", dataType: "string" },
        { label: "Time", key: "Time1", dataType: "string" },
        { label: "Material", key: "Material", dataType: "string" },
        { label: "Description", key: "Description", dataType: "string" },

        // Numeric fields
        { label: "Qty", key: "Qty"},
        { label: "Rate", key: "Rate", dataType: "number" },
        { label: "Amount", key: "Amount", dataType: "number" },
    ];

    // ✅ When show or filters change, fetch data
    useEffect(() => {
        if (show && (filters.FromDate && filters.ToDate)) {
            apiGet();
        }
    }, [show, filters]);

    // ✅ Fetch data from API
    const apiGet = async () => {
        try {
            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.post<MaintenanceRecord[]>(
                `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=VehicleMaintainanceReport`,
                {
                    FromDate: filters.FromDate,
                    ToDate: filters.ToDate,
                    Vehicle: data.Vehicle,
                }
            );
            setMaterialTop(res.data || []);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    // ✅ Handle date filter submission
    const handleSearchSubmit = (formData: Filters) => {
        setFilters(formData);
        setShowSearch(false);
    };

    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "1000px" }} >
            <OffcanvasHeader closeButton>
                <h5 className="mb-0 text-primary">{data.Vehicle}</h5>
            </OffcanvasHeader>
            <OffcanvasBody>
                <ProductionList appliedFilters={filters}
                    title={`Maintenance Report - ${data.Vehicle}`}
                    periodOptions={periodOptions}
                    tableHeaders={headers}
                    dealsData={materialTop}
                    handleShow={() => setShowSearch(true)}
                />

                <MaintainaceReportSerach
                    show={showSearch}
                    handleClose={() => setShowSearch(false)}
                    handleShow={() => setShowSearch(true)}
                    handleSubmit={handleSearchSubmit}
                />
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default MaintainaceReport;

