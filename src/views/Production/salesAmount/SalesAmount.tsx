import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductionList from "../../../components/reuse-components/productionList";
import logo from "../../../assets/img/NorisLogo-removebg-preview.png";
interface PaymentRecord {
    Date1: string;
    Payment: string;
    Amount: number | string;
}

interface PivotRow {
    Payment: string;
    [date: string]: string | number;
}

const SalesAmount = () => {
    const accessDenied = checkPageAccess("Production", "Sales Amount");
    if (accessDenied) return accessDenied;

    const [pivotData, setPivotData] = useState<PivotRow[]>([]);
    const [headers, setHeaders] = useState<{ label: string; key: string }[]>([]);
    const [grandTotals, setGrandTotals] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        apiGet();
    }, []);

    useEffect(() => {
        const style = document.createElement("style");

        style.innerHTML = `
                      @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                      }
                  `;

        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const apiGet = async () => {
        try {
            setLoading(true);

            const id = sessionStorage.getItem("selectedItems") ?? "";
            const res = await axios.get<PaymentRecord[]>(
                `https://norisapi.noris.in/Crusher/Production.php?ID=${id}&TableName=YearlyMaterialPayment`
            );

            const rawData = res.data || [];
            const { pivotRows, tableHeaders, totals } = transformToPivot(rawData);

            setPivotData(pivotRows);
            setHeaders(tableHeaders);
            setGrandTotals(totals);
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const transformToPivot = (data: PaymentRecord[]) => {
        const dateSet = new Set<string>();
        const paymentMap: Record<string, Record<string, number>> = {};

        data.forEach((item) => {
            const date = item.Date1;
            const payment = item.Payment;
            const amount = Number(item.Amount) || 0;

            dateSet.add(date);

            if (!paymentMap[payment]) paymentMap[payment] = {};
            if (!paymentMap[payment][date]) paymentMap[payment][date] = 0;

            paymentMap[payment][date] += amount;
        });

        const dates = Array.from(dateSet).sort((a, b) => {
            const [da, ma, ya] = a.split("-").map(Number);
            const [db, mb, yb] = b.split("-").map(Number);
            return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        });

        const pivotRows: PivotRow[] = [];

        Object.entries(paymentMap).forEach(([payment, dateValues]) => {
            const row: PivotRow = { Payment: payment };

            dates.forEach((date) => {
                const val = dateValues[date] || 0;
                row[date] = val.toFixed(2);
            });

            pivotRows.push(row);
        });

        const totals: Record<string, string> = {};

        dates.forEach((date) => {
            let colSum = 0;

            pivotRows.forEach((row) => {
                colSum += Number(row[date]) || 0;
            });

            totals[date] = colSum.toFixed(2);
        });

        const tableHeaders = [
            { label: "Payment", key: "Payment" },
            ...dates.map((d) => ({ label: d, key: d, dataType: "number" })),
        ];

        return { pivotRows, tableHeaders, totals };
    };

    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    return (
        <div className="page-wrapper">
            <div className="content p-2">

                {loading ? (
                    <div
                        style={{
                            height: "350px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: 150,
                                height: 150,
                            }}
                        >
                            {/* Rotating Circle */}
                            <div
                                style={{
                                    position: "absolute",
                                    width: 150,
                                    height: 150,
                                    border: "6px solid #e9ecef",
                                    borderTop: "6px solid #0d6efd",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                }}
                            />

                            {/* Center Logo */}
                            <img
                                src={logo}
                                alt="Loading"
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: 55,
                                    height: 55,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <ProductionList
                        title="Yearly Payment Pivot Summary"
                        periodOptions={periodOptions}
                        tableHeaders={headers}
                        dealsData={pivotData}
                    />
                )}

            </div>
        </div>
    );
};

export default SalesAmount;

