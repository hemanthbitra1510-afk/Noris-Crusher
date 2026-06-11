import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";
interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

// ✅ Generic groupBy function for multiple fields (e.g., Gross, Tare, Nett)
function groupByFields(
    data: any[],
    key: string,
    fields: string[]
): Record<string, Record<string, number>> {
    return data.reduce((acc, item) => {
        const group = item[key] || "Unknown";
        if (!acc[group]) {
            acc[group] = Object.fromEntries(fields.map((f) => [f, 0]));
        }

        fields.forEach((field) => {
            acc[group][field] += Number(item[field]) || 0;
        });

        return acc;
    }, {} as Record<string, Record<string, number>>);
}

const YardSummary: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const [activeSection, setActiveSection] = useState<string>("");

    // ✅ Grouped summaries
    const vehicleSummary = groupByFields(data, "Vehicle", ["Gross", "Tare", "Nett"]);
    const materialSummary = groupByFields(data, "Material", ["Gross", "Tare", "Nett"]);
    const dateSummary = groupByFields(data, "Date1", ["Gross", "Tare", "Nett"]);

    // ✅ Toggle visibility
    const toggleSection = (section: string) => {
  const accessDenied = checkPageAccess("Yard", "Reports");
  if (accessDenied) return accessDenied;

        setActiveSection((prev) => (prev === section ? "" : section));
    };

    // ✅ Table for Gross/Tare/Nett
    const renderMultiFieldTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, Record<string, number>>,
        fields: string[]
    ) => {
        const totals = fields.reduce((acc, field) => {
            acc[field] = Object.values(summary).reduce((sum, item) => sum + (item[field] || 0), 0);
            return acc;
        }, {} as Record<string, number>);

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
                                        {fields.map((field) => (
                                            <th key={field}>{field}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            {fields.map((field) => (
                                                <td key={field}>
                                                    {val[field]?.toLocaleString() || 0}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        {fields.map((field) => (
                                            <td key={field} className="text-danger">
                                                {totals[field].toLocaleString()}
                                            </td>
                                        ))}
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
                    <h5 className="mb-0 text-primary">Yard Summary</h5>
                    <small className="text-muted">Grouped totals by Vehicle, Material, and Date</small>
                </div>
            </OffcanvasHeader>
            <OffcanvasBody>
                {renderMultiFieldTable("Vehicle Wise Summary (Gross/Tare/Nett)", "Vehicle", vehicleSummary, ["Gross", "Tare", "Nett"])}
                {renderMultiFieldTable("Material Wise Summary (Gross/Tare/Nett)", "Material", materialSummary, ["Gross", "Tare", "Nett"])}
                {renderMultiFieldTable("Date Wise Summary (Gross/Tare/Nett)", "Date", dateSummary, ["Gross", "Tare", "Nett"])}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default YardSummary;
