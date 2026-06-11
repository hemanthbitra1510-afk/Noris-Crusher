import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Table, Badge, Spinner } from "react-bootstrap";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useToast } from "../../../components/reuse-components/Toast";

dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

interface ModalAttendanceProps {
    show: boolean;
    onClose: () => void;
    selectedDate: dayjs.Dayjs;
}

const ModalAttendance: React.FC<ModalAttendanceProps> = ({ show, onClose, selectedDate }) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const showToast = useToast();

    const isEditable = useMemo(() => {
        const today = dayjs().endOf("day");
        const target = selectedDate.startOf("day");
        return target.isSameOrBefore(today);
    }, [selectedDate]);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const IMIE = sessionStorage.getItem("selectedItems");
            const res = await axios.get(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployees`
            );
            if (Array.isArray(res.data)) {
                setEmployees(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            showToast("Error", "Failed to load employee list", "danger");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchAttendance = useCallback(async (date: dayjs.Dayjs) => {
        try {
            const IMIE = sessionStorage.getItem("selectedItems");
            const formattedDate = date.format("DD-MM-YYYY");
            const res = await axios.post(
                `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployeeAttendanceShow`,
                { Date1: formattedDate }
            );

            const map: Record<string, string> = {};
            if (Array.isArray(res.data)) {
                res.data.forEach((record: any) => {
                    if (record.Aadhar) {
                        map[record.Aadhar] = record.Day || record.Present;
                    }
                });
            }
            setAttendanceMap(map);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        }
    }, []);

    useEffect(() => {
        if (show) {
            fetchEmployees();
            fetchAttendance(selectedDate);
        }
    }, [show, selectedDate, fetchEmployees, fetchAttendance]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (!emp.DOL) return true;
            const dolDate = dayjs(emp.DOL, "DD-MM-YYYY").startOf("day");
            const targetDate = selectedDate.startOf("day");
            return targetDate.isSameOrBefore(dolDate);
        });
    }, [employees, selectedDate]);

    const handleAttendanceToggle = (aadhar: string, isPresent: boolean) => {
        setAttendanceMap(prev => ({
            ...prev,
            [aadhar]: isPresent ? "P" : "A"
        }));
    };

    const handleMarkAll = (status: "P" | "A") => {
        const newMap = { ...attendanceMap };
        filteredEmployees.forEach(emp => {
            if (emp.Aadhar) {
                newMap[emp.Aadhar] = status;
            }
        });
        setAttendanceMap(newMap);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const IMIE = sessionStorage.getItem("selectedItems");
            const dateStr = selectedDate.format("DD-MM-YYYY");

            const savePromises = filteredEmployees.map(emp => {
                const payload = {
                    Aadhar: emp.Aadhar,
                    Employee: emp.Employee,
                    Date1: dateStr,
                    Day: attendanceMap[emp.Aadhar] || "A"
                };
                return axios.post(
                    `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployeeAttendance&Date1=${dateStr}`,
                    payload
                );
            });

            await Promise.all(savePromises);
            showToast("Success", `Attendance for ${dateStr} saved successfully!`, "success");
            onClose();
        } catch (error) {
            console.error("Failed to save attendance:", error);
            showToast("Error", "Failed to save attendance. Please try again.", "danger");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered>
            <Modal.Header closeButton>
                <div>
                    <Modal.Title className="text-primary d-flex align-items-center gap-2">
                        Attendance Sheet
                        {!isEditable && (
                            <Badge bg="secondary" className="fs-6 fw-normal bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                                View Only
                            </Badge>
                        )}
                    </Modal.Title>
                    <small className="text-muted">
                        Date: <strong>{selectedDate.format("dddd, MMMM D, YYYY")}</strong>
                    </small>
                </div>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div className="d-flex justify-content-end p-2 gap-2 bg-light border-bottom">
                    <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleMarkAll("P")}
                        disabled={!isEditable}
                    >
                        All Present
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleMarkAll("A")}
                        disabled={!isEditable}
                    >
                        All Absent
                    </Button>
                </div>
                <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                    <Table hover className="align-middle mb-0">
                        <thead className="bg-light sticky-top">
                            <tr>
                                <th className="ps-3" style={{ width: "50px" }}>S.No</th>
                                <th>Employee</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-5">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="mt-2 mb-0">Loading Employees...</p>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp, idx) => {
                                    const isPresent = attendanceMap[emp.Aadhar] === "P";
                                    return (
                                        <tr key={emp.Aadhar || idx}>
                                            <td className="ps-3">{idx + 1}</td>
                                            <td>
                                                <div className="fw-bold">{emp.Employee}</div>
                                                <small className="text-muted">{emp.Designation}</small>
                                            </td>
                                            <td className="text-center">
                                                <Badge bg={isPresent ? "success" : "danger"} className="rounded-pill px-3">
                                                    {isPresent ? "Present" : "Absent"}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <div className="btn-group btn-group-sm rounded-pill overflow-hidden border">
                                                    <Button
                                                        variant={isPresent ? "success" : "light"}
                                                        onClick={() => handleAttendanceToggle(emp.Aadhar, true)}
                                                        className="px-3"
                                                        disabled={!isEditable}
                                                    >
                                                        P
                                                    </Button>
                                                    <Button
                                                        variant={!isPresent ? "danger" : "light"}
                                                        onClick={() => handleAttendanceToggle(emp.Aadhar, false)}
                                                        className="px-3"
                                                        disabled={!isEditable}
                                                    >
                                                        A
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-5 text-muted">
                                        No active employees for this date.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || filteredEmployees.length === 0 || !isEditable}
                >
                    {saving ? "Saving..." : "Save Attendance"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalAttendance;
