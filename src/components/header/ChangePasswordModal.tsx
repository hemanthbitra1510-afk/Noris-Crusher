import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader, Form, Button } from "react-bootstrap";
import axios from "axios";
import { useToast } from "../reuse-components/Toast";

interface ChangePasswordModalProps {
  show: boolean;
  onHide: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  show,
  onHide,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const id = sessionStorage.getItem("selectedItems") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("Error", "Passwords do not match", "danger");
      return;
    }

    if (newPassword.length < 4) {
      showToast("Error", "Password must be at least 4 characters", "danger");
      return;
    }

    try {
      setLoading(true);

      // 1. Get logged-in user profile from session to find them in the master table
      const userData = JSON.parse(sessionStorage.getItem("userData") || "[]");
      const sessionUser = userData[0] || {};

      const currentUserName = sessionUser.UserName || sessionUser.UserID || "";
      const currentMobile = sessionUser.Mobile || "";

      if (!currentUserName && !currentMobile) {
        showToast("Error", "User session invalid. Please login again.", "danger");
        return;
      }

      // 2. Fetch the master login table (GetLogins)
      const loginsRes = await axios.get(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=GetLogins`
      );

      const loginRecords = loginsRes.data || [];

      // Match by UserName first (most reliable), then Mobile
      const currentUserRecord = loginRecords.find((rec: any) => {
        const matchName = currentUserName && rec.UserName?.toString().trim() === currentUserName.toString().trim();
        const matchMobile = currentMobile && rec.Mobile?.toString().trim() === currentMobile.toString().trim();
        return matchName || matchMobile;
      });

      if (!currentUserRecord || !currentUserRecord.ID) {
        console.error("Match failed for:", { currentUserName, currentMobile });
        showToast("Error", "Could not identify your account in the system database.", "danger");
        return;
      }

      // 3. Perform ChangePassword with IDS = ID from GetLogins table
      const payload = {
        IDS: currentUserRecord.ID,
        Password: newPassword,
      };

      await axios.post(
        `https://norisapi.noris.in/Crusher/Masters.php?ID=${id}&Table=ChangePassword`,
        payload
      );

      showToast("Success", "Password changed successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
      onHide();
    } catch (err) {
      console.error("Password change failed:", err);
      showToast("Error", "Failed to change password. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <ModalHeader closeButton className="bg-primary bg-opacity-10 text-primary">
        <h5 className="modal-title">Change Password</h5>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Changing..." : "Update Password"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
