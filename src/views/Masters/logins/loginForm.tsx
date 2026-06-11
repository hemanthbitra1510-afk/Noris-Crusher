import { checkPageAccess } from "../../../utils/permission";
import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap";
import axios from "axios";
interface LoginFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: FormDataType) => void;
  initialData?: FormDataType | null; // ✅ allows edit mode
}

// Fields in the form
export interface FormDataType {
  IDS?: string | number; // ✅ added for edit mode
  Mobile: string;
  Typed: string;
  UserName: string;
  DataInsert: string;
  DataUpdate: string;
  DataDelete: string;
  NoOfDays: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  show,
  onHide,
  onSubmit,
  initialData = null,
}) => {
  const [formData, setFormData] = useState<FormDataType>({
    IDS: "",
    Mobile: "",
    Typed: "",
    UserName: "",
    DataInsert: "",
    DataUpdate: "",
    DataDelete: "",
    NoOfDays: "",
  });

  const accessDenied = checkPageAccess("Masters", "Logins");

  const [rolesList, setRolesList] = useState<any[]>([]);
  const id = sessionStorage.getItem("selectedItems") ?? "";

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.post(
          `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=GetRoles`
        );
        if (res.data && Array.isArray(res.data)) {
          setRolesList(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }
    };
    if (show) {
      fetchRoles();
    }
  }, [id, show]);

  // ✅ Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        IDS: (initialData as any).ID // Just send IDS = id for edit
      });
    } else {
      setFormData({
        Mobile: "",
        Typed: "",
        UserName: "",
        DataInsert: "",
        DataUpdate: "",
        DataDelete: "",
        NoOfDays: "",
      })
    }
  }, [initialData, show]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Only validate visible fields
    if (
      !formData.Mobile.trim() ||
      !formData.UserName.trim()
    ) {
      return;
    }

    // ✅ Structure payload as requested (metadata preserved for edit)
    const payload = {
      DataDelete: formData.DataDelete || "",
      DataInsert: formData.DataInsert || "",
      DataUpdate: formData.DataUpdate || "",
      Mobile: formData.Mobile,
      Password: formData.Mobile.substring(0, 4),
      NoOfDays: formData.NoOfDays || "",
      Typed: formData.Typed || "Owner",
      UserName: formData.UserName,
    };

    onSubmit(payload);

    if (!initialData) {
      setFormData({
        IDS: "",
        Mobile: "",
        Typed: "",
        UserName: "",
        DataInsert: "",
        DataUpdate: "",
        DataDelete: "",
        NoOfDays: "",
      });
    }

    onHide();
  };

  const isFormValid =
    formData.Mobile.trim() !== "" &&
    formData.UserName.trim() !== "";

  if (accessDenied) return accessDenied;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <ModalHeader
        closeButton
        className="p-3 bg-primary bg-opacity-10 text-primary"
      >
        {initialData ? "Edit Login" : "Add Login"}
      </ModalHeader>

      <form onSubmit={handleSubmit} className="tablelist-form">
        <ModalBody>
          <div className="row g-3">
            {/* Mobile */}
            <div className="col-md-6">
              <label htmlFor="Mobile" className="form-label">
                Mobile
              </label>
              <input
                type="tel"
                name="Mobile"
                id="Mobile"
                className="form-control"
                value={formData.Mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // remove non-numbers
                  if (value.length <= 10) {
                    setFormData({ ...formData, Mobile: value });
                  }
                }}
                placeholder="Enter Mobile"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                required
              />
            </div>


            {/* Typed */}
            <div className="col-md-6">
              <label htmlFor="Typed" className="form-label">
                Typed (Role Assign)
              </label>
              <select
                name="Typed"
                id="Typed"
                className="form-select"
                value={formData.Typed}
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                {rolesList.map((role: any, idx: number) => (
                  <option key={idx} value={role.RoleName}>
                    {role.RoleName}
                  </option>
                ))}
              </select>
              <small className="text-muted mt-1 d-block">
                Leave empty for <strong>Owner</strong> role
              </small>
            </div>

            {/* User Name */}
            <div className="col-md-6">
              <label htmlFor="UserName" className="form-label">
                User Name
              </label>
              <input
                type="text"
                name="UserName"
                id="UserName"
                className="form-control"
                value={formData.UserName}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 20); // limit to 20 chars
                  setFormData({ ...formData, UserName: value });
                }}
                placeholder="Enter User Name"
                maxLength={20}
                required
              />
            </div>



          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" className="btn btn-light" onClick={onHide}>
            Close
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isFormValid}
          >
            {initialData ? "Update Login" : "Add Login"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default LoginForm;