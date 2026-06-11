import { useState } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ModalAttendance from "./ModalAttendance";
import { checkPageAccess } from "../../../utils/permission";

const EmployeeAttendance = () => {
    const accessDenied = checkPageAccess("Employee", "Attendance");
    if (accessDenied) return accessDenied;

    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
    const [showModal, setShowModal] = useState(false);

    const handleDateClick = (info: any) => {
        setSelectedDate(dayjs(info.dateStr));
        setShowModal(true);
    };

    return (
        <div className="page-wrapper">
            <style>
                {`
                    .attendance-calendar-card {
                        border-radius: 16px;
                        overflow: hidden;
                        transition: all 0.3s ease;
                    }
                    
                    /* FullCalendar Custom Premium Styling */
                    .fc {
                        --fc-border-color: #f0f2f5;
                        --fc-button-bg-color: #4361ee;
                        --fc-button-border-color: #4361ee;
                        --fc-button-hover-bg-color: #3f37c9;
                        --fc-button-hover-border-color: #3f37c9;
                        --fc-button-active-bg-color: #3a0ca3;
                        --fc-button-active-border-color: #3a0ca3;
                        --fc-today-bg-color: rgba(67, 97, 238, 0.05);
                        font-family: 'Inter', sans-serif;
                    }

                    .fc .fc-toolbar-title {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #1e293b;
                    }

                    .fc .fc-button {
                        padding: 8px 16px;
                        font-weight: 600;
                        border-radius: 8px;
                        text-transform: capitalize;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        transition: all 0.2s ease;
                    }

                    .fc .fc-button:focus {
                        box-shadow: 0 0 0 0.2rem rgba(67, 97, 238, 0.25) !important;
                    }

                    .fc .fc-daygrid-day {
                        transition: background-color 0.2s ease;
                        cursor: pointer;
                    }

                    .fc .fc-daygrid-day:hover {
                        background-color: #f8fafc !important;
                    }

                    .fc .fc-daygrid-day.fc-day-today {
                        background-color: rgba(67, 97, 238, 0.08) !important;
                    }

                    .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                        background-color: #4361ee;
                        color: white;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 4px;
                        font-weight: bold;
                    }

                    .fc .fc-col-header-cell {
                        background-color: #f8fafc;
                        padding: 12px 0;
                        border-bottom: 2px solid #e2e8f0;
                    }

                    .fc .fc-col-header-cell-cushion {
                        color: #64748b;
                        font-weight: 600;
                        text-decoration: none;
                        text-transform: uppercase;
                        font-size: 0.8rem;
                        letter-spacing: 0.05em;
                    }

                    .fc-theme-bootstrap5 a {
                        color: #1e293b;
                        text-decoration: none;
                    }

                    .fc .fc-daygrid-day-top {
                        flex-direction: row;
                    }

                    /* Calendar responsiveness for desktop */
                    @media (min-width: 992px) {
                        .fc {
                            aspect-ratio: 1.8;
                        }
                    }
                `}
            </style>
            
            <div className="content p-4">
                <Row className="justify-content-center">
                    <Col lg={11} xl={10}>
                        <Card className="attendance-calendar-card shadow border-0 pt-2">
                            <Card.Header className="bg-white py-4 px-4 border-bottom-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="mb-1 text-dark fw-bold">Attendance Calendar</h4>
                                    <p className="text-muted mb-0 small">Select a date to manage employee attendance</p>
                                </div>
                                <div className="d-none d-md-block">
                                    <Badge bg="primary" className="p-2 px-3 rounded-pill bg-opacity-10 text-primary border border-primary border-opacity-25">
                                        <i className="bi bi-info-circle me-1"></i> Click any day to mark presence
                                    </Badge>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: ""
                                    }}
                                    selectable={true}
                                    dateClick={handleDateClick}
                                    height="auto"
                                    contentHeight="auto"
                                    dayMaxEvents={true}
                                    themeSystem="bootstrap5"
                                    firstDay={1}
                                    fixedWeekCount={false}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            <ModalAttendance
                show={showModal}
                selectedDate={selectedDate}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
};

export default EmployeeAttendance;
