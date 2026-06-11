import { hasPermission, checkPageAccess } from "../../../utils/permission";
import { useEffect, useState } from "react";
import { Col, Modal, Row, Form, Button } from "react-bootstrap";
import PredefinedDatePicker from "../../../components/common-dateRangePicker/PredefinedDatePicker";
import axios from "axios";
import Select from "react-select";
interface SearchModalProps {
  show: boolean;
  handleClose: () => void;
  handleSubmit: (formData: any) => void;
}

const SalesDebitorReportSearch = ({ show, handleClose, handleSubmit }: SearchModalProps) => {
  const accessDenied = checkPageAccess("Sales", "Debitor Report");
  if (accessDenied) return accessDenied;

  const [formData, setFormData] = useState({
    Party: "",
    FromDate: "",
    ToDate: "",
  });
  const [datePreset, setDatePreset] = useState("");

  const [partyList, setPartyList] = useState<string[]>([]);

  // 👉 Load Party List When Modal Opens
  useEffect(() => {
    if (show) {
      fetchPartyList();
    }
  }, [show]);

  const fetchPartyList = async () => {
    try {
      const id = sessionStorage.getItem("selectedItems") ?? "";
      const response = await axios.get(
        `https://norisapi.noris.in/Crusher/Sales.php?ID=${id}&TableName=MyLedgersData`
      );

      const data = Array.isArray(response.data) ? response.data : [];

      const uniqueParties = Array.from(
        new Set(data.map((item: any) => item.Party))
      );

      setPartyList(uniqueParties as string[]);
    } catch (error) {
      console.error("Error loading party list:", error);
      setPartyList([]);
    }
  };

  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let from = "";
    let to = "";

    switch (preset) {
      case "today":
        from = to = today.toISOString().split("T")[0];
        break;

      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        to = today.toISOString().split("T")[0];
        break;

      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          .toISOString()
          .split("T")[0];
        to = new Date(today.getFullYear(), today.getMonth(), 0)
          .toISOString()
          .split("T")[0];
        break;

      case "clear":
        from = "";
        to = "";
        break;
    }

    setFormData((prev) => ({
      ...prev,
      FromDate: from,
      ToDate: to,
    }));
  };


  return (
    <Modal show={show} onHide={handleClose} centered size="sm" className="search-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Search Filters</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>

          {/* 👉 Party Dropdown */}
          <Row className="mb-3">
            <Form.Group>
              <Form.Label>
                Party <span className="text-danger">*</span>
              </Form.Label>

              <Select
                options={partyList.map((p) => ({
                  value: p,
                  label: p,
                }))}
                value={
                  formData.Party
                    ? { value: formData.Party, label: formData.Party }
                    : null
                }
                onChange={(selected: any) =>
                  setFormData({
                    ...formData,
                    Party: selected ? selected.value : "",
                  })
                }
                placeholder="-- Select Party --"
                isSearchable
              />

            </Form.Group>
          </Row>

          {/* 👉 Date Range */}
          {/* 👉 From Date */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.FromDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      FromDate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          {/* 👉 To Date */}
          <Row>
            <Col md={12}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.ToDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ToDate: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-warning" className="px-4 fw-semibold" onClick={handleClose}>
          Cancel
        </Button>

        <Button
          variant="danger"
          className="px-4 fw-semibold"
          onClick={() => {
            if (!formData.Party) {
              alert("Please select a Party!");
              return;
            }
            handleSubmit(formData);
          }}
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SalesDebitorReportSearch;

