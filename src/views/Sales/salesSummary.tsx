import { hasPermission, checkPageAccess } from "../../utils/permission";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";
// ------------------------------------------------------
// ✅ Full Type — Not imported from outside
// ------------------------------------------------------
export interface SalesReportEntry {
    DCNum: string;
    Vehicle: string;
    Material: string;
    Party: string;
    Destination: string;
    Units: string;
    Rate: string;
    Nett: string;
    Amount: string;
    Transport: string;
    GST: string;
    TotalAmount: string;
    Driver: string;
    Operator: string;
    Date1: string;
    Time1: string;
    FirstDateTime: string;
    Discount: string;
    Payment: string;
    ClearedOn: string;
    Receiver: string;
    NBC: string;
    Gross: string;
    Tare: string;
    Phone: string;
    Transporter: string;
    ReceiptAmount: string;
    Blocked: string;
    Km: string;
    Source: string;
    ID: string;
    Approve: string;
    ApprovedBy: string;
    DateTime: string;
    AUnits: string;
    Less: string;
    Permit: string;
    Stationary: string;
    Royality: string;
    invoice: string;
    SGST: string;
    CGST: string;
    IGST: string;
    TransitPass: string;
    TransporterAmount: string;
    TRate: string;
    TareDate: string;
    TareTime: string;
    Typed: string;
}

// ------------------------------------------------------
// 🔥 Universal Grouping Function
// ------------------------------------------------------
function groupBySummary(data: SalesReportEntry[], key: keyof SalesReportEntry) {
    return data.reduce((acc: any, item) => {
        const group = item[key] || "Unknown";

        if (!acc[group]) {
            acc[group] = {
                Nett: 0,
                Gross: 0,
                Tare: 0,
                TotalAmount: 0,
                Trips: 0,
            };
        }

        acc[group].Nett += Number(item.Nett) || 0;
        acc[group].Gross += Number(item.Gross) || 0;
        acc[group].Tare += Number(item.Tare) || 0;
        acc[group].TotalAmount += Number(item.TotalAmount) || 0;
        acc[group].Trips += 1;

        return acc;
    }, {});
}

interface SummaryProps {
    show: boolean;
    onClose: () => void;
    data: SalesReportEntry[];
}

// ------------------------------------------------------
// ⭐ FINAL OFFCANVAS COMPONENT
// ------------------------------------------------------
const SalesSummaryOffcanvas: React.FC<SummaryProps> = ({ show, onClose, data }) => {

    const accessDenied = checkPageAccess("Sales", "Sales Reports");
    if (accessDenied && show) {
        return (
            <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "850px" }}>
                <OffcanvasHeader closeButton>
                    <h5 className="mb-0 text-danger">Access Denied</h5>
                </OffcanvasHeader>
                <OffcanvasBody>
                    {accessDenied}
                </OffcanvasBody>
            </Offcanvas>
        );
    }

    // ⚡ Create Summaries
    const dateSummary = groupBySummary(data, "Date1");
    const vehicleSummary = groupBySummary(data, "Vehicle");
    const materialSummary = groupBySummary(data, "Material");
    const partySummary = groupBySummary(data, "Party");

    const [activeSection, setActiveSection] = useState<string>("Date");

    const toggleSection = (section: string) => {
        setActiveSection((prev) => (prev === section ? "" : section));
    };

    // 🔥 Reusable Table Renderer
    const renderSummaryTable = (title: string, sectionKey: string, summary: any) => {
        const totalNett = Object.values(summary).reduce((sum: any, v: any) => sum + v.Nett, 0);
        const totalGross = Object.values(summary).reduce((sum: any, v: any) => sum + v.Gross, 0);
        const totalTare = Object.values(summary).reduce((sum: any, v: any) => sum + v.Tare, 0);
        const totalAmount = Object.values(summary).reduce((sum: any, v: any) => sum + v.TotalAmount, 0);
        const totalTrips = Object.values(summary).reduce((sum: any, v: any) => sum + v.Trips, 0);

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
                        <table className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th>{title.split(" ")[0]}</th>
                                    <th>Trips</th>
                                    <th>Gross</th>
                                    <th>Tare</th>
                                    <th>Nett</th>
                                    <th>Total Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {Object.entries(summary).map(([key, val]: any) => (
                                    <tr key={key}>
                                        <td>{key}</td>
                                        <td>{val.Trips}</td>
                                        <td>{(val.Gross / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>{(val.Tare / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>{(val.Nett / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="text-success fw-bold">
                                            ₹ {val.TotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}

                                <tr className="fw-bold bg-light">
                                    <td className="fw-bold">Grand Total</td>
                                    <td className="fw-bold">{totalTrips}</td>
                                    <td className="fw-bold">{(totalGross / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="fw-bold">{(totalTare / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="fw-bold">{(totalNett / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="text-danger fw-bold">₹ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Collapse>
            </div>
        );
    };

    return (
        <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "850px" }}>
            <OffcanvasHeader closeButton>
                <div>
                    <h5 className="mb-0 text-primary">Sales Summary Report</h5>
                    <small className="text-muted">Breakdown by date, vehicle, material & party</small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderSummaryTable("Date Wise Summary", "Date", dateSummary)}
                {renderSummaryTable("Vehicle Wise Summary", "Vehicle", vehicleSummary)}
                {renderSummaryTable("Material Wise Summary", "Material", materialSummary)}
                {renderSummaryTable("Party Wise Summary", "Party", partySummary)}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default SalesSummaryOffcanvas;

