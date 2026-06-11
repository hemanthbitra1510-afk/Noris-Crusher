import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";
interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

const SPECIAL_IMIE_IDS = ["IMIE02062022", "IMIE08042023", "IMIE14072023"];

// Generic groupBy (Date, DCNum, Vehicle, Quarry, Extractor)
function groupByKey(data: any[], key: string, imie: string) {
    return data.reduce(
        (
            acc: Record<string, { Nett: number; Amount: number; Trips: number }>,
            item
        ) => {
            const group = item[key] || "Unknown";

            if (!acc[group]) acc[group] = { Nett: 0, Amount: 0, Trips: 0 };

            acc[group].Nett += Number(item.Nett) || 0;
            acc[group].Amount += Number(item.Amount) || 0;

            if (SPECIAL_IMIE_IDS.includes(imie)) {
                acc[group].Trips += Number(item.Vehicle) || 0;
            } else {
                acc[group].Trips += 1;
            }

            return acc;
        },
        {}
    );
}

const SummaryOffcanvas: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const currentIMIE = sessionStorage.getItem("selectedItems") || "";
    const driverSummary = groupByKey(data, "Vehicle", currentIMIE);
    const quarrySummary = groupByKey(data, "Quarry", currentIMIE);
    const extractorSummary = groupByKey(data, "Extractor", currentIMIE);
    const dateSummary = groupByKey(data, "Date1", currentIMIE);

    // ✅ Blocked Summary
    const blockedRecords = data.filter((item) => item.Blocked === "Blocked");
    const blockedTrips = SPECIAL_IMIE_IDS.includes(currentIMIE)
        ? blockedRecords.reduce((sum, item) => sum + (Number(item.Vehicle) || 0), 0)
        : blockedRecords.length;
    const blockedNett = blockedRecords.reduce((sum, item) => sum + (Number(item.Nett) || 0), 0);
    const blockedAmount = blockedRecords.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);

    // ✅ Keep track of which section is open
    const [activeSection, setActiveSection] = useState<string>("Driver");

    const toggleSection = (section: string) => {
  const accessDenied = checkPageAccess("Quarry", "Reports");
  if (accessDenied) return accessDenied;

        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Nett: number; Amount: number; Trips: number }>,
        hideFirstColumn: boolean = false
    ) => {
        const totalNett = Object.values(summary).reduce((sum, val) => sum + val.Nett, 0);
        const totalAmount = Object.values(summary).reduce((sum, val) => sum + val.Amount, 0);
        const totalTrips = Object.values(summary).reduce((sum, val) => sum + val.Trips, 0);

        return (
            <div className="card flex-fill mb-1">
                <div
                    className="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-danger">{title}</h6>
                    <span>{activeSection === sectionKey ? "−" : "+"}</span>
                </div>

                <Collapse in={activeSection === sectionKey}>
                    <div className="card-body">
                        <div className="table-responsive custom-table">
                            <table className="table dataTable table-nowrap no-footer w-100">
                                <thead>
                                    <tr>
                                        {!hideFirstColumn && <th className="bg-danger bg-opacity-10 text-danger">{title.split(" ")[0]}</th>}
                                        <th className="bg-danger bg-opacity-10 text-danger">Trips</th>
                                        <th className="bg-danger bg-opacity-10 text-danger">Total Nett</th>
                                        <th className="bg-danger bg-opacity-10 text-danger">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            {!hideFirstColumn && <td>{key}</td>}
                                            <td>{val.Trips}</td>
                                            <td>{val.Nett.toLocaleString()}</td>
                                            <td className="text-success">₹ {val.Amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        {!hideFirstColumn && <td>Grand Total</td>}
                                        <td>{hideFirstColumn ? `Total: ${totalTrips}` : totalTrips}</td>
                                        <td>{totalNett.toLocaleString()}</td>
                                        <td className="text-danger">₹ {totalAmount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Collapse>
            </div>
        );
    };

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "850px" }}>
            <OffcanvasHeader closeButton>
                <div>
                    <h5 className="mb-0 text-danger">Summary Report</h5>
                    <small className="text-muted">
                        Overview of trips, nett, amount & blocked records
                    </small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Driver Wise Summary", "Driver", driverSummary, SPECIAL_IMIE_IDS.includes(currentIMIE))}
                {renderTable("Quarry Wise Summary", "Quarry", quarrySummary)}
                {renderTable("Extractor Wise Summary", "Extractor", extractorSummary)}
                {renderTable("Date Wise Summary", "Date", dateSummary)}

                {/* ✅ Blocked Summary */}
                <div className="card flex-fill mb-3">
                    <div
                        className="card-header bg-dark bg-opacity-10 d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleSection("Blocked")}
                    >
                        <h6 className="mb-0 text-dark">🚫 Blocked Summary</h6>
                        <span>{activeSection === "Blocked" ? "−" : "+"}</span>
                    </div>

                    <Collapse in={activeSection === "Blocked"}>
                        <div className="card-body">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>No. of Blocked</th>
                                        <th>Total Nett</th>
                                        <th>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-danger fw-bold">{blockedTrips}</td>
                                        <td>{blockedNett.toLocaleString()}</td>
                                        <td className="text-danger">₹ {blockedAmount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Collapse>
                </div>
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default SummaryOffcanvas;

