import { useState, useEffect, useCallback } from "react";
import ListComponent from "../../../components/reuse-components/listComponent";
import axios from "axios";
import ModalEmployee from "./ModalEmployee";
import ModalDeleteEmployee from "./ModalDeleteEmployee";
import ModalAdvanceEmployee from "../advances/ModalAdvanceEmployee";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const EmployeeList = () => {
    const periodOptions = ["All", "This Month", "Last Month", "This Year"];

    const headers: { label: string; key: string; dataType?: "string" | "number" | "index" | "action" }[] = [
        { label: "S.No", key: "sno", dataType: "index" },
        { label: "Employee Name", key: "Employee", dataType: "string" },
        { label: "Contact", key: "Contact", dataType: "string" },
        { label: "Designation", key: "Designation", dataType: "string" },
        { label: "Date Of Joining", key: "DOJ", dataType: "date" },
        { label: "Date Of Leaving", key: "DOL", dataType: "date" },
        { label: "Status", key: "Status", dataType: "string" },
    ];

    const [dealsData, setDealsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const IMIE = sessionStorage.getItem("selectedItems");
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployees`
            );
            if (Array.isArray(res.data)) {
                setDealsData(res.data);
            } else {
                setDealsData([]);
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            setDealsData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const onAddClick = () => {
        setSelectedEmployee(null);
        setShowModal(true);
    };

    const handleEdit = (row: any) => {
        setSelectedEmployee(row);
        setShowModal(true);
    };

    const handleDelete = (row: any) => {
        setSelectedEmployee(row);
        setShowDeleteModal(true);
    };

    const handleAdvance = (row: any) => {
        setSelectedEmployee(row);
        setShowAdvanceModal(true);
    };

    const handleSuccess = () => {
        fetchEmployees();
    };

    const getRowClass = (deal: any) => {
        if (!deal.DOL || deal.Status === "Active") return "bg-white";

        const today = dayjs().startOf("day");
        const dolDate = dayjs(deal.DOL, "DD-MM-YYYY").startOf("day");

        if (dolDate.isSame(today)) {
            return "table-warning"; // Leaving today
        } else if (dolDate.isBefore(today)) {
            return "table-danger"; // Left already
        }

        return "bg-white";
    };

    return (
        <div className="page-wrapper">
            <div className="content p-2">
                <ListComponent
                    title="Employees List"
                    periodOptions={periodOptions}
                    tableHeaders={headers}
                    dealsData={dealsData}
                    loading={loading}
                    onAddClick={onAddClick}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handlePay={handleAdvance}
                    onSuccess={handleSuccess}
                    getRowClass={getRowClass}
                />
            </div>

            <ModalEmployee
                show={showModal}
                onClose={() => setShowModal(false)}
                modeldata={selectedEmployee}
                onSuccess={handleSuccess}
            />

            <ModalDeleteEmployee
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                employeeData={selectedEmployee}
                onSuccess={handleSuccess}
            />

            <ModalAdvanceEmployee
                show={showAdvanceModal}
                onClose={() => setShowAdvanceModal(false)}
                onSuccess={handleSuccess}
                initialData={selectedEmployee}
            />
        </div>
    );
};

export default EmployeeList;
