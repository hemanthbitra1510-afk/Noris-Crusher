import { checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button, Form, Row, Col } from "react-bootstrap";
import dayjs from "dayjs";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import Select from "react-select";

interface DieselIssueFormProps {
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

const DieselIssueForm = ({ show, onClose, onSubmit, initialData }: DieselIssueFormProps) => {
  const [formData, setFormData] = useState({
    Vehicle: "",
    Reading: "",
    Transfer: "",
    Litres: "",
    Rate: "",
    Amount: "",
    Bunk: "",
    Party: "",
    Date1: dayjs().format("DD-MM-YYYY"),
  });
  const [vehicles, setVehicles] = useState<Ledger[]>([]);

  const accessDenied = checkPageAccess("Diesel", "Issue");

  useEffect(() => {
    if (accessDenied) return;
    const fetchLedgers = async () => {
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";
        const res = await fetch(
          `https://norisapi.noris.in/Crusher/Accounts.php?ID=${id}&TableName=MyLedgers`
        );
        const data = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((l: Ledger) => l.Status !== "Inactive")
          : [];
        setVehicles(filtered);
      } catch (err) {
        console.error("Failed to load vehicle/contractor ledgers", err);
      }
    };
    fetchLedgers();
  }, []);

  const suppliers = vehicles.filter(
    (l) => l.Type?.toLowerCase() === "supplier"
  );

  // ✅ Populate fields when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        Bunk: initialData.Bunk ?? "",
        Party: initialData.Party ?? initialData.Driver ?? "",
        Litres: initialData.Litres?.toString() ?? "",
        Rate: initialData.Rate?.toString() ?? "",
        Amount: initialData.Amount?.toString() ?? "",

      });

    }
    else {
      fetchDieselRate(); // ✅ auto fetch when adding new
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto calculate Amount = Litres × Rate
      if (name === "Litres" || name === "Rate") {
        const litres = name === "Litres" ? Number(value) : Number(prev.Litres);
        const rate = name === "Rate" ? Number(value) : Number(prev.Rate);
        updated.Amount = (litres * rate).toString();
      }
      return updated;
    });
  };
  const fetchDieselRate = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      if (!id) return;

      const res = await fetch(
        `https://norisapi.noris.in/Crusher/Inventory.php?ID=${id}&TableName=SparesRate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Spares: "Diesel", // ✅ payload
          }),
        }
      );

      const data = await res.json();

      // ✅ Assuming API returns something like [{ Rate: 95 }]
      const rate = Array.isArray(data) ? data[0]?.Rate : data?.Rate;

      if (rate) {
        setFormData((prev) => {
          const litres = Number(prev.Litres || 0);
          return {
            ...prev,
            Rate: rate.toString(),
            Amount: (litres * Number(rate)).toString(), // auto update amount
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch Diesel rate", err);
    }
  };
  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "600px" }}>
      <OffcanvasHeader closeButton>
        <h5 className="mb-0 text-primary">
          {initialData ? "Edit Diesel Issue" : "Add Diesel Issue"}
        </h5>
      </OffcanvasHeader>
      <OffcanvasBody>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Vehicle</Form.Label>
                <Select
                  options={vehicles.map((v) => ({
                    value: v.Party,
                    label: `${v.Party} (${v.Type})`,
                  }))}
                  value={
                    formData.Vehicle
                      ? {
                        value: formData.Vehicle,
                        label: formData.Vehicle,
                      }
                      : null
                  }
                  onChange={(selectedOption) =>
                    setFormData((prev) => ({
                      ...prev,
                      Vehicle: selectedOption ? selectedOption.value : "",
                    }))
                  }
                  placeholder="Search Vehicle / Contractor..."
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Party</Form.Label>
                <Select
                  options={vehicles.map((v) => ({
                    value: v.Party,
                    label: `${v.Party} (${v.Type})`,
                  }))}
                  value={
                    formData.Party
                      ? {
                        value: formData.Party,
                        label: formData.Party,
                      }
                      : null
                  }
                  onChange={(selectedOption) =>
                    setFormData((prev) => ({
                      ...prev,
                      Party: selectedOption ? selectedOption.value : "",
                    }))
                  }
                  placeholder="Search Party..."
                  isClearable
                />
              </Form.Group>
            </Col>

          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reading</Form.Label>
                <Form.Control
                  type="number"
                  name="Reading"
                  value={formData.Reading}
                  onChange={handleChange}
                  placeholder="Enter reading"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Litres</Form.Label>
                <Form.Control
                  type="number"
                  name="Litres"
                  value={formData.Litres}
                  onChange={handleChange}
                  placeholder="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bunk (Supplier)</Form.Label>
                <Select
                  options={suppliers.map((s) => ({
                    value: s.Party,
                    label: s.Party,
                  }))}
                  value={
                    formData.Bunk
                      ? { value: formData.Bunk, label: formData.Bunk }
                      : null
                  }
                  onChange={(selectedOption) => {
                    const value = selectedOption ? selectedOption.value : "";

                    setFormData((prev) => ({
                      ...prev,
                      Bunk: value,
                    }));

                    fetchDieselRate(); // ✅ trigger API
                  }}
                  placeholder="Search Supplier..."
                  isClearable
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="Transfer"
                  value={formData.Transfer}
                  onChange={handleChange}
                  placeholder="Enter description"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Rate</Form.Label>
                <Form.Control
                  type="number"
                  name="Rate"
                  value={formData.Rate}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type="number"
                  name="Amount"
                  value={formData.Amount}
                  readOnly
                  placeholder="Auto calculated"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <CommonDatePicker
                  value={formData.Date1 ? dayjs(formData.Date1, "DD-MM-YYYY") : null}
                  format="DD-MM-YYYY"
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      Date1: date ? dayjs(date).format("DD-MM-YYYY") : "",
                    }))
                  }
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <div className="d-flex justify-content-end mt-3">
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

export default DieselIssueForm;
