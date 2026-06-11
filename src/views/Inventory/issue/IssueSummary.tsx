import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";
interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

// ✅ Generic groupBy for Qty & Amount
function groupByKey(
    data: any[],
    key: string
): Record<string, { Qty: number; Amount: number }> {
    return data.reduce((acc, item) => {
        const group = item[key] || "Unknown";

        if (!acc[group]) acc[group] = { Qty: 0, Amount: 0 };

        acc[group].Qty += Number(item.Qty) || 0;
        acc[group].Amount += Number(item.Amount) || 0;

        return acc;
    }, {} as Record<string, { Qty: number; Amount: number }>);
}

const SummaryOffcanvas: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const payeeSummary = groupByKey(data, "Payee");
    const materialSummary = groupByKey(data, "Material");
    const ledgerSummary = groupByKey(data, "Ledger");
    const dateSummary = groupByKey(data, "Date1");
    const issuedToSummary = groupByKey(data, "IssuedTo"); // ✅ Added

    const [activeSection, setActiveSection] = useState<string>("Payee");

    const toggleSection = (section: string) => {
  const accessDenied = checkPageAccess("Inventory", "Issue");
  if (accessDenied) return accessDenied;

        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Qty: number; Amount: number }>
    ) => {
        const totalQty = Object.values(summary).reduce((sum, val) => sum + val.Qty, 0);
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
                                        <th>Total Qty</th>
                                        <th>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{val.Qty.toLocaleString()}</td>
                                            <td className="text-success">₹ {val.Amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        <td>{totalQty.toLocaleString()}</td>
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
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "900px" }}>
            <OffcanvasHeader closeButton>
                <div>
                    <h5 className="mb-0 text-primary">Material Issue Summary</h5>
                    <small className="text-muted">Grouped totals for Qty and Amount</small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Payee Wise Summary", "Payee", payeeSummary)}
                {renderTable("Material Wise Summary", "Material", materialSummary)}
                {renderTable("Ledger Wise Summary", "Ledger", ledgerSummary)}
                {renderTable("Issued To Wise Summary", "IssuedTo", issuedToSummary)} {/* ✅ Added */}
                {renderTable("Date Wise Summary", "Date", dateSummary)}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default SummaryOffcanvas;
