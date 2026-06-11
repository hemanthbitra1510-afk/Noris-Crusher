import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";
interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

// ✅ Generic groupBy for Litres & Amount
function groupByKey(
    data: any[],
    key: string
): Record<string, { Litres: number; Amount: number }> {
    return data.reduce((acc, item) => {
        const group = item[key] || "Unknown";

        if (!acc[group]) acc[group] = { Litres: 0, Amount: 0 };

        acc[group].Litres += Number(item.Litres) || 0;
        acc[group].Amount += Number(item.Amount) || 0;

        return acc;
    }, {} as Record<string, { Litres: number; Amount: number }>);
}

const DieselSummaryOffcanvas: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const dateSummary = groupByKey(data, "Date1");     // ✅ Group by Date
    const vehicleSummary = groupByKey(data, "Vehicle"); // ✅ Group by Vehicle

    const [activeSection, setActiveSection] = useState<string>("Date");

    const toggleSection = (section: string) => {
  const accessDenied = checkPageAccess("Diesel", "Issue");
  if (accessDenied) return accessDenied;

        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Litres: number; Amount: number }>
    ) => {
        const totalLitres = Object.values(summary).reduce((sum, val) => sum + val.Litres, 0);
        const totalAmount = Object.values(summary).reduce((sum, val) => sum + val.Amount, 0);

        return (
            <div className="card flex-fill mb-2">
                <div
                    className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-primary">{title}</h6>
                    <span>{activeSection === sectionKey ? "−" : "+"}</span>
                </div>

                <Collapse in={activeSection === sectionKey}>
                    <div className="card-body">
                        <div className="table-responsive custom-table">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>{title.split(" ")[0]}</th>
                                        <th>Total Litres</th>
                                        <th>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{val.Litres.toLocaleString()}</td>
                                            <td className="text-success">₹ {val.Amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        <td>{totalLitres.toLocaleString()}</td>
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
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "750px" }}>
            <OffcanvasHeader closeButton>
                <div>
                    <h5 className="mb-0 text-primary">Diesel Issue Summary</h5>
                    <small className="text-muted">Grouped totals for Litres and Amount</small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Date Wise Summary", "Date", dateSummary)}
                {renderTable("Vehicle Wise Summary", "Vehicle", vehicleSummary)}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default DieselSummaryOffcanvas;

