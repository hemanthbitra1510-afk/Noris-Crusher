import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isEdit: boolean;
}

const MaterialForm = ({ show, onHide, onSubmit, initialData, isEdit }: Props) => {
  const [material, setMaterial] = useState("");
  const [gst, setGst] = useState("");
  const [nonGst, setNonGst] = useState("");

  useEffect(() => {
    if (initialData) {
      setMaterial(initialData.Material);
      setGst(initialData.ZohoGSTID);
      setNonGst(initialData.ZohoNonID);
    } else {
      setMaterial("");
      setGst("");
      setNonGst("");
    }
  }, [initialData]);

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5>{isEdit ? "Edit Material" : "Add Material"}</h5>
              <button className="btn-close" onClick={onHide} />
            </div>

            <div className="modal-body">
              <label>Material</label>
              
<small className="text-muted">
    ("MM" must be added manually)
</small>
<input
  className="form-control"
  value={material}
  onChange={(e) => setMaterial(e.target.value)}
/>


              <label className="mt-2">Zoho GST ID</label>
              <input className="form-control" value={gst} onChange={(e) => setGst(e.target.value)} />

              <label className="mt-2">Zoho Non GST ID</label>
              <input className="form-control" value={nonGst} onChange={(e) => setNonGst(e.target.value)} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onHide}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  onSubmit({
                    Material: material,
                    ZohoGSTID: gst,
                    ZohoNonID: nonGst,
                  })
                }
              >
                Save
              </button>
            </div>

          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default MaterialForm;