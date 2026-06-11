import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";

interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

function groupByKey(data: any[], key: string) {
    return data.reduce(
        (
            acc: Record<string, { Nett: number; FinalWeight: number; Trips: number }>,
            item
        ) => {
            const group = item[key] || "Unknown";
            if (!acc[group]) acc[group] = { Nett: 0, FinalWeight: 0, Trips: 0 };
            acc[group].Nett += Number(item.Nett) || 0;
            acc[group].FinalWeight += Number(item.FinalWeight) || 0;
            acc[group].Trips += 1;
            return acc;
        },
        {}
    );
}

const SummaryOffcanvas: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const partySummary = groupByKey(data, "Party");
    const vehicleSummary = groupByKey(data, "Vehicle");
    const materialSummary = groupByKey(data, "Material");
    const dateSummary = groupByKey(data, "GrossDate");

    const [activeSection, setActiveSection] = useState<string>("Party");

    const toggleSection = (section: string) => {
        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Nett: number; FinalWeight: number; Trips: number }>
    ) => {
        const totalNett = Object.values(summary).reduce((sum, val) => sum + val.Nett, 0);
        const totalFinal = Object.values(summary).reduce((sum, val) => sum + val.FinalWeight, 0);
        const totalTrips = Object.values(summary).reduce((sum, val) => sum + val.Trips, 0);

        return (
            <div className="card flex-fill mb-1">
                <div
                    className="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-success">{title}</h6>
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
                                        <th className="text-end">Total Nett</th>
                                        <th className="text-end">Final Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td className="text-center">{val.Trips}</td>
                                            <td className="text-end">{val.Nett.toLocaleString()}</td>
                                            <td className="text-end">{val.FinalWeight.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        <td className="text-center">{totalTrips}</td>
                                        <td className="text-end text-success">{totalNett.toLocaleString()}</td>
                                        <td className="text-end text-success">{totalFinal.toLocaleString()}</td>
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
                    <h5 className="mb-0 text-success">Input Materials Summary</h5>
                    <small className="text-muted">
                        Overview of trips, nett weight and final weight
                    </small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Party Wise Summary", "Party", partySummary)}
                {renderTable("Vehicle Wise Summary", "Vehicle", vehicleSummary)}
                {renderTable("Material Wise Summary", "Material", materialSummary)}
                {renderTable("Date Wise Summary", "Date", dateSummary)}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default SummaryOffcanvas;
