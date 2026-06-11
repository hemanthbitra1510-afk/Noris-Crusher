import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button, Form, Row, Col } from "react-bootstrap";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import dayjs from "dayjs";
import Select from "react-select";
interface VehicleDocFormProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: any;
}
interface Ledger {
  ID: string;
  Party: string;
  Type: string;
  Status?: string;
}


const VehicleDocForm = ({ show, onClose, onSubmit, initialData }: VehicleDocFormProps) => {
  const accessDenied = checkPageAccess("Vehicle", "Vehicle");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Vehicle: "",
    InsuranceDate: dayjs().format("DD-MM-YYYY"),
    Insurance: "",
    PollutionDate: dayjs().format("DD-MM-YYYY"),
    Pollution: "",
    FitnessDate: dayjs().format("DD-MM-YYYY"),
    Fitness: "",
    PermitDate: dayjs().format("DD-MM-YYYY"),
    Permit: "",
    TaxDate: dayjs().format("DD-MM-YYYY"),
    Tax: "",
  });

  // Set initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [vehicles, setVehicles] = useState<Ledger[]>([]);
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        const res = await fetch(
          `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
        );

        const data = await res.json();

        const filtered = Array.isArray(data)
          ? data
          : [];

        setVehicles(filtered);
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      }
    };

    fetchVehicles();
  }, []);

  const handleDateChange = (name: string, value: any) => {
    const formattedDate = value ? dayjs(value).format("DD-MM-YYYY") : "";
    setFormData((prev) => ({ ...prev, [name]: formattedDate }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "600px" }}>
      <OffcanvasHeader closeButton>
        <h5 className="mb-0 text-primary">
          {initialData ? "Edit Vehicle Document" : "Add Vehicle Document"}
        </h5>
      </OffcanvasHeader>
      <OffcanvasBody>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Vehicle</Form.Label>
            <Select
              options={vehicles.map((v) => ({
                value: v.Party,
                label: v.Party,
              }))}
              value={
                formData.Vehicle
                  ? { value: formData.Vehicle, label: formData.Vehicle }
                  : null
              }
              onChange={(selectedOption) =>
                handleChange("Vehicle", selectedOption ? selectedOption.value : "")
              }
              placeholder="Search and Select Vehicle"
              isSearchable
              isClearable
            />

          </Form.Group>

          {/* Row 1: Insurance */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Insurance Date</Form.Label>
                <CommonDatePicker
                  value={formData.InsuranceDate ? dayjs(formData.InsuranceDate, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("InsuranceDate", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Insurance Expiry</Form.Label>
                <CommonDatePicker
                  value={formData.Insurance ? dayjs(formData.Insurance, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("Insurance", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Row 2: Pollution */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Pollution Date</Form.Label>
                <CommonDatePicker
                  value={formData.PollutionDate ? dayjs(formData.PollutionDate, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("PollutionDate", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Pollution Expiry</Form.Label>
                <CommonDatePicker
                  value={formData.Pollution ? dayjs(formData.Pollution, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("Pollution", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Row 3: Fitness */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Fitness Date</Form.Label>
                <CommonDatePicker
                  value={formData.FitnessDate ? dayjs(formData.FitnessDate, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("FitnessDate", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Fitness Expiry</Form.Label>
                <CommonDatePicker
                  value={formData.Fitness ? dayjs(formData.Fitness, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("Fitness", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Row 4: Permit */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Permit Date</Form.Label>
                <CommonDatePicker
                  value={formData.PermitDate ? dayjs(formData.PermitDate, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("PermitDate", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Permit Expiry</Form.Label>
                <CommonDatePicker
                  value={formData.Permit ? dayjs(formData.Permit, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("Permit", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Row 5: Tax */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tax Date</Form.Label>
                <CommonDatePicker
                  value={formData.TaxDate ? dayjs(formData.TaxDate, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("TaxDate", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tax Expiry</Form.Label>
                <CommonDatePicker
                  value={formData.Tax ? dayjs(formData.Tax, "DD-MM-YYYY") : null}
                  onChange={(date) => handleDateChange("Tax", date)}
                  format="DD-MM-YYYY"
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" className="me-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {initialData ? "Update" : "Save"}
          </Button>
        </div>
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default VehicleDocForm;
