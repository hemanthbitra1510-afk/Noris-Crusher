import { hasPermission, checkPageAccess } from "../../../utils/permission";
import React, { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap";
interface SourcesFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (source: string) => void;
}

const SourcesForm: React.FC<SourcesFormProps> = ({ show, onHide, onSubmit }) => {
  const [source, setSource] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
  const accessDenied = checkPageAccess("Masters", "Source");
  if (accessDenied) return accessDenied;

    e.preventDefault();
    if (!source.trim()) return;
    onSubmit(source);
    setSource("");
    onHide(); 
  };

  return (
   <Modal show={show} onHide={onHide} centered>
  <ModalHeader closeButton className="p-3 bg-primary bg-opacity-10 text-primary">
    Add Source
  </ModalHeader>
  <form onSubmit={handleSubmit} className="tablelist-form">
    <ModalBody>
      <div className="mb-3">
        <label htmlFor="source" className="form-label">
          Source
        </label>
        <input
          type="text"
          id="source"
          className="form-control"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Enter source"
        />
      </div>
    </ModalBody>
    <ModalFooter>
      <button
        type="button"
        className="btn btn-light"
        onClick={onHide}
      >
        Close
      </button>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!source.trim()}  
      >
        Add Source
      </button>
    </ModalFooter>
  </form>
</Modal>

  );
};

export default SourcesForm;
