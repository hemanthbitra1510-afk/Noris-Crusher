import { Modal, Button } from "react-bootstrap";
import CommonDatePicker from "../../../components/common-datePicker/commonDatePicker";
import { useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { useToast } from "../../../components/reuse-components/Toast";

interface ModalDeleteEmployeeProps {
  show: boolean;
  onClose: () => void;
  employeeData: Record<string, any> | null;
  onSuccess: () => void;
}

const ModalDeleteEmployee: React.FC<ModalDeleteEmployeeProps> = ({
  show,
  onClose,
  employeeData,
  onSuccess,
}) => {
  const [dol, setDol] = useState<string>(dayjs().format("DD-MM-YYYY"));
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleDelete = async () => {
    if (!dol) {
      showToast("Error", "Please select a Date of Leaving", "danger");
      return;
    }

    setLoading(true);
    try {
      const IMIE = sessionStorage.getItem("selectedItems");

      const payload = {
        Aadhar: employeeData?.Aadhar || employeeData?.aadhar,
        Status: "Inactive",
        DOL: dol,
      };

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/Employee.php?ID=${IMIE}&TableName=MyEmployeeDelete`,
        payload
      );

      if (res.status === 200) {
        showToast("Success", "Employee deactivated successfully!", "success");
        onSuccess();
        onClose();
      } else {
        showToast("Error", "Failed to deactivate employee", "danger");
      }
    } catch (error) {
      console.error("Deactivation error:", error);
      showToast("Error", "An error occurred during deactivation", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Deactivate Employee</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to deactivate <strong>{employeeData?.Employee || employeeData?.name}</strong>?
        </p>
        <div className="mb-3">
          <label className="form-label">Date of Leaving (DOL)</label>
          <CommonDatePicker
            value={dol ? dayjs(dol, "DD-MM-YYYY") : null}
            format="DD-MM-YYYY"
            onChange={(date) => setDol(date ? dayjs(date).format("DD-MM-YYYY") : "")}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? "Deactivating..." : "Deactivate"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDeleteEmployee;
