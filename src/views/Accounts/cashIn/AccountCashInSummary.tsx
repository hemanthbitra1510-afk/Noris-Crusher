import React from "react";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";

interface SummaryOffcanvasProps {
    show: boolean;
    onClose: () => void;
    data: any[];
}

function groupByKey(
    data: any[],
    key: string
): Record<string, { Amount: number }> {
    return data.reduce((acc, item) => {
        const group = item[key] || "Unknown";
        if (!acc[group]) acc[group] = { Amount: 0 };
        acc[group].Amount += Number(item.DebitAmount) || 0;
        return acc;
    }, {} as Record<string, { Amount: number }>);
}

const AccountCashInSummary: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const dateSummary = groupByKey(data, "Date1");
    const partySummary = groupByKey(data, "Party");
    const paymentModeSummary = groupByKey(data, "PaymentMode");

    const [activeSection, setActiveSection] = useState<string>("Date");

    const toggleSection = (section: string) => {
        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderTable = (
        title: string,
        sectionKey: string,
        summary: Record<string, { Amount: number }>,
        columnHeader: string
    ) => {
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
                                        <th>{columnHeader}</th>
                                        <th>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summary).map(([key, val]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td className="text-success">₹ {val.Amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
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
                    <h5 className="mb-0 text-primary">Cash In Summary</h5>
                    <small className="text-muted">Grouped totals for Receipts</small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderTable("Date Wise Summary", "Date", dateSummary, "Date")}
                {renderTable("Party Wise Summary", "Party", partySummary, "Party Name")}
                {renderTable("Payment Mode Summary", "PaymentMode", paymentModeSummary, "Payment Mode")}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default AccountCashInSummary;
