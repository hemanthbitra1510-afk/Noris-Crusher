import axios from "axios";
import { useEffect, useState } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../common-dateRangePicker/PredefinedDatePicker";
import Select from "react-select";

interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleShow: () => void;
  handleSubmit: (formData: any) => void;
  defaultValues?: any;
}

interface DropdownRow {
  Vehicle?: string;
  Quarry?: string;
  Extractor?: string;
  Driver?: string;
}

interface SelectOption {
  label: string;
  value: string;
}

const SearchModal = ({
  show,
  handleClose,
  handleShow,
  handleSubmit,
  defaultValues,
}: SearchModalProps) => {
  const [data, setData] = useState<DropdownRow[]>([]);
  const getTodayWithTime = (time: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${time}`;
  };

  const [formData, setFormData] = useState({
    Vehicle: "",
    Quarry: "",
    Extractor: "",
    Driver: "",
    FromDate: getTodayWithTime("08:00"), // default 8 AM
    ToDate: getTodayWithTime("20:00"),   // default 8 PM
  });
  useEffect(() => {
    if (defaultValues) {
      setFormData((prev) => ({
        ...prev,
        ...defaultValues,
      }));
    }
  }, [defaultValues]);


  /* ----------------------------- API CALL ----------------------------- */
  const getApi = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const res = await axios.get(
        `https://norisapi.noris.in/Crusher/Quarry.php?ID=${id}&Table=GetQuarryDropdown`
      );
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setData([]);
    }
  };

  useEffect(() => {
    getApi();
  }, []);


  /* ---------------------- UNIQUE OPTIONS ---------------------- */
  const unique = (key: keyof DropdownRow): string[] => {
    if (!Array.isArray(data)) return [];
    return Array.from(
      new Set(
        data
          .map((d) => d[key])
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      )
    );
  };

  const vehicleOptions: SelectOption[] = unique("Vehicle").map((v) => ({
    label: v,
    value: v,
  }));

  const quarryOptions: SelectOption[] = unique("Quarry").map((q) => ({
    label: q,
    value: q,
  }));

  const extractorOptions: SelectOption[] = unique("Extractor").map((e) => ({
    label: e,
    value: e,
  }));

  const driverOptions: SelectOption[] = unique("Driver").map((d) => ({
    label: d,
    value: d,
  }));

  /* ----------------------------- HANDLERS ----------------------------- */
  const handleSearch = () => {
    handleSubmit(formData);
    handleClose();
  };

  /* ------------------------------- UI ------------------------------- */
  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="primary"
        onClick={handleShow}
        className="d-flex align-items-center justify-content-center p-2"
        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
      >
        <i className="bi bi-funnel-fill"></i>
      </Button>

      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Search Filters</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* Vehicle + Quarry */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Vehicle</Form.Label>
                  <Select
                    options={vehicleOptions}
                    isClearable
                    placeholder="Select or type vehicle..."
                    value={
                      formData.Vehicle
                        ? { label: formData.Vehicle, value: formData.Vehicle }
                        : null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        Vehicle: selected ? selected.value : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Quarry</Form.Label>
                  <Select
                    options={quarryOptions}
                    isClearable
                    placeholder="Select or type quarry..."
                    value={
                      formData.Quarry
                        ? { label: formData.Quarry, value: formData.Quarry }
                        : null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        Quarry: selected ? selected.value : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Extractor + Driver */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Extractor</Form.Label>
                  <Select
                    options={extractorOptions}
                    isClearable
                    placeholder="Select extractor..."
                    value={
                      formData.Extractor
                        ? {
                          label: formData.Extractor,
                          value: formData.Extractor,
                        }
                        : null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        Extractor: selected ? selected.value : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Driver</Form.Label>
                  <Select
                    options={driverOptions}
                    isClearable
                    placeholder="Select or type driver..."
                    value={
                      formData.Driver
                        ? { label: formData.Driver, value: formData.Driver }
                        : null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        Driver: selected ? selected.value : "",
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Time Range */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Date & Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.FromDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        FromDate: e.target.value,
                      }))
                    }
                  />

                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Date & Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.ToDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ToDate: e.target.value,
                      }))
                    }
                  />

                </Form.Group>
              </Col>
            </Row>

          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SearchModal;
