import { useState, useEffect } from "react";
import { Offcanvas, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import axios from "axios";

interface TransporterVehicleFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: any) => void;
  initialData?: any;
  isEdit?: boolean;
}

const TransporterVehicleForm: React.FC<TransporterVehicleFormProps> = ({
  show,
  onHide,
  onSubmit,
  initialData,
  isEdit,
}) => {
  const [formData, setFormData] = useState({
    Transporter: "",
    Vehicle: "",
  });

  const [transporters, setTransporters] = useState<any[]>([]);

  useEffect(() => {
    if (show) {
      if (isEdit && initialData) {
        setFormData({
          Transporter: initialData.Transporter || "",
          Vehicle: initialData.Vehicle || "",
        });
      } else {
        setFormData({
          Transporter: "",
          Vehicle: "",
        });
      }
      fetchData();
    }
  }, [show, isEdit, initialData]);

  const fetchData = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";

      // Fetch Transporters (all ledgers)
      const resTrans = await axios.get(
        `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
      );
      setTransporters(Array.isArray(resTrans.data) ? resTrans.data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {isEdit ? "Edit Transporter Vehicle" : "Add Transporter Vehicle"}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Transporter</Form.Label>
                <Select
                  options={transporters.map((t) => ({ label: `${t.Party} (${t.Type})`, value: t.Party }))}
                  value={
                    formData.Transporter
                      ? { label: formData.Transporter, value: formData.Transporter }
                      : null
                  }
                  onChange={(selected: any) =>
                    setFormData({ ...formData, Transporter: selected ? selected.value : "" })
                  }
                  placeholder="Select Transporter"
                  isSearchable
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Vehicle</Form.Label>
                <Form.Control
                  type="text"
                  name="Vehicle"
                  value={formData.Vehicle}
                  onChange={(e) => setFormData({ ...formData, Vehicle: e.target.value })}
                  placeholder="Enter Vehicle Number"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default TransporterVehicleForm;
