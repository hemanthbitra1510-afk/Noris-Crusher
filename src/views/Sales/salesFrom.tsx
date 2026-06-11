import { hasPermission, checkPageAccess } from "../../utils/permission";
import { useEffect, useState } from "react";
import {
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Button,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { Link } from "react-router-dom"; // Fixed wrong import
import dayjs from "dayjs";
import Select from "react-select";
import axios from "axios";
interface VehicleDocFormProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: any;
  showDCField?: boolean;
  showSourceField?: boolean;
}

const SalesForm = ({
  show,
  onClose,
  onSubmit,
  initialData,
  showDCField = false,
  showSourceField = false,
}: VehicleDocFormProps) => {
  const accessDenied = checkPageAccess("Sales", "Salesfrom");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [parties, setParties] = useState<{ value: string; label: string }[]>([]);
  const [materials, setMaterials] = useState<{ value: string; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const activeFields = [
    { label: "Date", key: "Date", type: "date" },
    ...(showDCField ? [{ label: "DC No", key: "DCNum", type: "text" }] : []),
    { label: "Vehicle", key: "Vehicle", type: "text" },
    { label: "Party", key: "Party", type: "text" },
    { label: "Material", key: "Material", type: "text" },
    ...(showSourceField ? [{ label: "Source", key: "Source", type: "text" }] : []),
    { label: "Destination", key: "Destination", type: "text" },
    { label: "Transporter", key: "Transporter", type: "text" },
    { label: "Driver", key: "Driver", type: "text" },
    { label: "Gross", key: "Gross", type: "number" },
    { label: "Tare", key: "Tare", type: "number" },
    { label: "Net", key: "Nett", type: "number" },
    { label: "Rate", key: "Rate", type: "number" },
    { label: "Amount", key: "Amount", type: "number" },
    { label: "Transport", key: "Transport", type: "number" },
    { label: "Less", key: "Less", type: "number" },
    { label: "Total", key: "TotalAmount", type: "number" },
    { label: "Payment", key: "Payment", type: "text" },
    { label: "Stationary", key: "Stationary", type: "string" },
  ];

  // Fetch Options when Form opens
  useEffect(() => {
    if (!show) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const id = sessionStorage.getItem("selectedItems") ?? "";

        // Fetch Parties
        const partiesRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
        );
        const partiesList = Array.isArray(partiesRes.data) ? partiesRes.data : [];
        const mappedParties = Array.from(new Set(partiesList.map((p: any) => p.Party)))
          .filter(Boolean)
          .map((party) => ({ value: party, label: party }));
        setParties(mappedParties);

        // Fetch Materials
        const materialsRes = await axios.get(
          `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=MyMaterials`
        );
        const materialsList = Array.isArray(materialsRes.data) ? materialsRes.data : [];
        const mappedMaterials = materialsList
          .map((m: any) => m.Material)
          .filter(Boolean)
          .map((mat) => ({ value: mat, label: mat }));
        setMaterials(mappedMaterials);

      } catch (err) {
        console.error("Failed to load options in SalesForm", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [show]);

  // Initialize or reset form
  useEffect(() => {
    const defaultData: { [key: string]: any } = {};
    activeFields.forEach((f) => {
      defaultData[f.key] = f.type === "number" ? 0 : "";
    });

    const merged = { ...defaultData, ...initialData };

    // Format Date correctly for input type="date"
    let dateVal = merged.Date || merged.Date1 || "";
    if (dateVal) {
      if (dateVal.includes("-") && dateVal.split("-")[0].length === 2) {
        const [d, m, y] = dateVal.split("-");
        dateVal = `${y}-${m}-${d}`;
      }
    } else {
      dateVal = dayjs().format("YYYY-MM-DD");
    }
    merged.Date = dateVal;

    setFormData(calculateDerivedFields(merged || ""));
  }, [initialData, showDCField, showSourceField]);

  // Calculate dependent fields
  const calculateDerivedFields = (data: { [key: string]: any }) => {
    const gross = parseFloat(data["Gross"]) || 0;
    const tare = parseFloat(data["Tare"]) || 0;
    const net = gross - tare;

    const rate = parseFloat(data["Rate"]) || 0;
    const amount = (net * rate) / 1000;

    const transport = parseFloat(data["Transport"]) || 0;
    const less = parseFloat(data["Less"]) || 0;

    const total = amount + transport - less;

    return {
      ...data,
      Nett: net >= 0 ? net : 0,
      Amount: amount >= 0 ? amount : 0,
      TotalAmount: total >= 0 ? total : 0,
    };
  };

  // Handle input changes
  const handleChange = (key: string, value: string) => {
    const field = activeFields.find((f) => f.key === key);
    const parsedValue = field?.type === "number" ? parseFloat(value) || 0 : value;
    const updated = { ...formData, [key]: parsedValue };
    const newData = key === "Nett" ? updated : calculateDerivedFields(updated);

    setFormData(newData);
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" style={{ width: "1200px" }}>
      <OffcanvasHeader closeButton>
        <h5 className="mb-0 text-primary">
          {initialData ? "Edit Entry" : "Add Entry"}
        </h5>
      </OffcanvasHeader>
      <OffcanvasBody>
        <Form>
          <div className="accordion accordion-bordered" id="sales_form_accordion">
            <div className="accordion-item rounded mb-3">
              <div className="accordion-header">
                <Link
                  to="#"
                  className="accordion-button accordion-custom-button rounded"
                  data-bs-toggle="collapse"
                  data-bs-target="#basic_sales_info"
                >
                  <span className="avatar avatar-md rounded me-1">
                    <i className="ti ti-file-plus" />
                  </span>
                  Sales Info
                </Link>
              </div>
              <div
                className="accordion-collapse collapse show"
                id="basic_sales_info"
                data-bs-parent="#sales_form_accordion"
              >
                <div className="accordion-body border-top">
                  <Row>
                    {activeFields.map((field) => (
                      <Col md={6} key={field.key} className="mb-3">
                        <Form.Group>
                          <Form.Label>{field.label}</Form.Label>
                          {field.key === "Party" ? (
                            <Select
                              options={parties}
                              value={parties.find(opt => opt.value === formData.Party) || null}
                              onChange={(selected) => handleChange("Party", selected?.value || "")}
                              placeholder="Select or Search Party..."
                              isClearable
                              isLoading={loadingOptions}
                            />
                          ) : field.key === "Material" ? (
                            <Select
                              options={materials}
                              value={materials.find(opt => opt.value === formData.Material) || null}
                              onChange={(selected) => handleChange("Material", selected?.value || "")}
                              placeholder="Select or Search Material..."
                              isClearable
                              isLoading={loadingOptions}
                            />
                          ) : (
                            <Form.Control
                              type={field.type}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              value={formData[field.key] || ""}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              disabled={
                                field.disabled ||
                                (
                                  initialData && 
                                  ["Gross", "Tare", "Nett"].includes(field.key)
                                )
                              }
                            />
                          )}
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            </div>
          </div>
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

export default SalesForm;

