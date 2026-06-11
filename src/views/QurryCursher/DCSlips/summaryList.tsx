import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";

interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

function groupByKey(data: any[], key: string, valueKey: string = "CFT") {
    return data.reduce(
        (
            acc: Record<string, { Value: number; Trips: number }>,
            item
        ) => {
            const group = item[key] || "Unknown";
            if (!acc[group]) acc[group] = { Value: 0, Trips: 0 };
            acc[group].Value += Number(item[valueKey]) || 0;
            acc[group].Trips += 1;
            return acc;
        },
        {}
    );
}

const SummaryOffcanvas: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const vehicleSummary = groupByKey(data, "Vehicle");
    const materialSummary = groupByKey(data, "Material");
    const royalitySummary = groupByKey(data, "Royality");
    const dateSummary = groupByKey(data, "Date1");

    const [activeSection, setActiveSection] = useState<string>("Vehicle");

    const toggleSection = (section: string) => {
        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Value: number; Trips: number }>,
        valueLabel: string = "Total CFT"
    ) => {
        const totalValue = Object.values(summary).reduce((sum, val) => sum + val.Value, 0);
        const totalTrips = Object.values(summary).reduce((sum, val) => sum + val.Trips, 0);

        return (
            <div className="card flex-fill mb-1">
                <div
                    className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-primary">{title}</h6>
                    <span>{activeSection === sectionKey ? "−" : "+"}</span>
                </div>

                <Collapse in={activeSection === sectionKey}>
                    <div className="card-body p-0">
                        <div className="table-responsive custom-table">
                            <table className="table dataTable table-nowrap no-footer w-100 mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>{title.split(" ")[0]}</th>
                                        <th className="text-center">Trips</th>
                                        <th className="text-end">{valueLabel}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td className="text-center">{val.Trips}</td>
                                            <td className="text-end">{val.Value.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        <td className="text-center">{totalTrips}</td>
                                        <td className="text-end text-primary">{totalValue.toLocaleString()}</td>
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
                    <h5 className="mb-0 text-primary">DC Slips Summary</h5>
                    <small className="text-muted">
                        Overview of trips and CFT across different categories
                    </small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Vehicle Wise Summary", "Vehicle", vehicleSummary)}
                {renderTable("Material Wise Summary", "Material", materialSummary)}
                {renderTable("Royality Wise Summary", "Royality", royalitySummary)}
                {renderTable("Date Wise Summary", "Date", dateSummary)}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default SummaryOffcanvas;
