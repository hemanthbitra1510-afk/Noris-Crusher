import React from "react";
import { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Collapse } from "react-bootstrap";

const formatIndian = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

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

const AccountCashOutSummary: React.FC<SummaryOffcanvasProps> = ({ show, onClose, data }) => {
    const paymentModeSummary = groupByKey(data, "Bank");
    const voucherSummary = groupByKey(data, "LedgerFamily");

    const [activeSection, setActiveSection] = useState<string>("Date");

    const toggleSection = (section: string) => {
        setActiveSection((prev) => (prev === section ? "" : section));
    };

    const renderDateBankTable = () => {
        // 1. Get unique banks
        const banks = Array.from(new Set(data.map((item) => item.Bank || "Unknown"))).sort();
        
        // 2. Group by Date and then by Bank
        const dateSummary: Record<string, any> = {};

        data.forEach((item) => {
            const date = item.Date1 || "Unknown";
            const bank = item.Bank || "Unknown";
            const amount = Number(item.DebitAmount) || 0;

            if (!dateSummary[date]) {
                dateSummary[date] = { total: 0 };
                banks.forEach((b) => (dateSummary[date][b] = 0));
            }
            dateSummary[date][bank] += amount;
            dateSummary[date].total += amount;
        });

        // 3. Sort dates descending
        const sortedDates = Object.keys(dateSummary).sort((a, b) => {
             // Basic date sort attempt
             return new Date(b).getTime() - new Date(a).getTime();
        });

        // 4. Calculate grand totals for Date Wise
        const grandTotals: Record<string, number> = { total: 0 };
        banks.forEach((b) => (grandTotals[b] = 0));
        sortedDates.forEach((date) => {
            banks.forEach((bank) => {
                grandTotals[bank] += dateSummary[date][bank];
            });
            grandTotals.total += dateSummary[date].total;
        });

        const sectionKey = "Date";

        return (
            <div className="card flex-fill mb-2">
                <div
                    className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-primary">Date Wise Summary (Bank Details)</h6>
                    <span>{activeSection === sectionKey ? "−" : "+"}</span>
                </div>

                <Collapse in={activeSection === sectionKey}>
                    <div className="card-body">
                        <div className="table-responsive custom-table">
                            <table className="table table-bordered text-center">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Date</th>
                                        {banks.map((bank) => (
                                            <th key={bank}>{bank}</th>
                                        ))}
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDates.map((date) => (
                                        <tr key={date}>
                                            <td className="fw-bold">{date}</td>
                                            {banks.map((bank) => (
                                                <td key={bank}>
                                                    {dateSummary[date][bank] > 0
                                                        ? `₹ ${formatIndian(dateSummary[date][bank])}`
                                                        : "-"}
                                                </td>
                                            ))}
                                            <td className="text-primary fw-bold">
                                                ₹ {formatIndian(dateSummary[date].total)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        {banks.map((bank) => (
                                            <td key={bank} className="text-success">
                                                {grandTotals[bank] > 0
                                                    ? `₹ ${formatIndian(grandTotals[bank])}`
                                                    : "-"}
                                            </td>
                                        ))}
                                        <td className="text-danger">
                                            ₹ {formatIndian(grandTotals.total)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Collapse>
            </div>
        );
    };

    const renderPartyBankTable = () => {
        // 1. Get unique banks
        const banks = Array.from(new Set(data.map((item) => item.Bank || "Unknown"))).sort();

        // 2. Group by Party (item.Names) and then by Bank
        const partySummary: Record<string, any> = {};

        data.forEach((item) => {
            const party = item.Names || "Unknown";
            const bank = item.Bank || "Unknown";
            const amount = Number(item.DebitAmount) || 0;

            if (!partySummary[party]) {
                partySummary[party] = { total: 0 };
                banks.forEach((b) => (partySummary[party][b] = 0));
            }
            partySummary[party][bank] += amount;
            partySummary[party].total += amount;
        });

        // 3. Sort party names alphabetically
        const sortedParties = Object.keys(partySummary).sort();

        // 4. Calculate grand totals for Party Wise
        const grandTotals: Record<string, number> = { total: 0 };
        banks.forEach((b) => (grandTotals[b] = 0));
        sortedParties.forEach((party) => {
            banks.forEach((bank) => {
                grandTotals[bank] += partySummary[party][bank];
            });
            grandTotals.total += partySummary[party].total;
        });

        const sectionKey = "Party";

        return (
            <div className="card flex-fill mb-2">
                <div
                    className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleSection(sectionKey)}
                >
                    <h6 className="mb-0 text-primary">Party Wise Summary (Bank Details)</h6>
                    <span>{activeSection === sectionKey ? "−" : "+"}</span>
                </div>

                <Collapse in={activeSection === sectionKey}>
                    <div className="card-body">
                        <div className="table-responsive custom-table">
                            <table className="table table-bordered text-center">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Party Name</th>
                                        {banks.map((bank) => (
                                            <th key={bank}>{bank}</th>
                                        ))}
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParties.map((party) => (
                                        <tr key={party}>
                                            <td className="fw-bold text-start">{party}</td>
                                            {banks.map((bank) => (
                                                <td key={bank}>
                                                    {partySummary[party][bank] > 0
                                                        ? `₹ ${formatIndian(partySummary[party][bank])}`
                                                        : "-"}
                                                </td>
                                            ))}
                                            <td className="text-primary fw-bold">
                                                ₹ {formatIndian(partySummary[party].total)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td className="text-start">Grand Total</td>
                                        {banks.map((bank) => (
                                            <td key={bank} className="text-success">
                                                {grandTotals[bank] > 0
                                                    ? `₹ ${formatIndian(grandTotals[bank])}`
                                                    : "-"}
                                            </td>
                                        ))}
                                        <td className="text-danger">
                                            ₹ {formatIndian(grandTotals.total)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Collapse>
            </div>
        );
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
                                            <td className="text-success">₹ {formatIndian(val.Amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="fw-bold bg-light">
                                        <td>Grand Total</td>
                                        <td className="text-danger">₹ {formatIndian(totalAmount)}</td>
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
                    <h5 className="mb-0 text-primary">Cash Out Summary</h5>
                    <small className="text-muted">Grouped totals for Payments</small>
                </div>
            </OffcanvasHeader>

            <OffcanvasBody>
                {renderDateBankTable()}
                {renderPartyBankTable()}
                {renderTable("Payment Mode Summary", "PaymentMode", paymentModeSummary, "Payment Mode")}
                {renderTable("Voucher Summary", "Voucher", voucherSummary, "Voucher")}
            </OffcanvasBody>
        </Offcanvas>
    );
};

export default AccountCashOutSummary;
