import { checkPageAccess } from "../../../utils/permission";
import { useState, useEffect, useMemo } from "react";
import { Card, Table, Form, Button } from "react-bootstrap";
import axios from "axios";
import { getSidebarData } from "../../../components/sidebar/sidebarData";
import React from "react";
import Select from "react-select";
interface Permission {
  view: boolean;
  add: boolean;
  update: boolean;
  delete: boolean;
}

interface SubModule {
  name: string;
  displayName: string;
  permissions: Permission;
  dirty?: boolean; // ✅ ADDED
}

interface ModulePermission {
  module: string;
  permissions: Permission;
  subModules: SubModule[];
}



const createEmptyPermission = (): Permission => ({
  view: false,
  add: false,
  update: false,
  delete: false,
});



const Roles = () => {
  const id = sessionStorage.getItem("selectedItems") ?? "";
  const SidebarData = useMemo(() => getSidebarData(), [id]);
  const accessDenied = checkPageAccess("Masters", "Roles");
  if (accessDenied) return accessDenied;

  if (!id) {
    console.warn("No company selected");
  }

  const [modules, setModules] = useState<ModulePermission[]>([]);
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");


  useEffect(() => {
    if (!id) return; // 🔥 prevent API call

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

    fetchRoles();
  }, [id]);

  const roleOptions = rolesList.map((r: any) => ({
    value: r.RoleName,
    label: r.RoleName,
  }));
  /* ================= BUILD MODULES FROM SIDEBAR ================= */
  useEffect(() => {
    const mainMenu = SidebarData[0]?.submenuItems || [];

    const builtModules: ModulePermission[] = mainMenu.map((menu: any) => ({
      module: menu.label,
      permissions: createEmptyPermission(),
      subModules: menu.submenuItems?.length
        ? menu.submenuItems.map((sub: any) => ({
          name: sub.moduleName || sub.label,
          displayName: sub.label,
          permissions: createEmptyPermission(),
          dirty: false, // ✅ ADDED
        }))
        : [
          {
            name: menu.label,
            displayName: menu.label,
            permissions: createEmptyPermission(),
            dirty: false, // ✅ ADDED
          },
        ],
    }));

    setModules(builtModules);
  }, [SidebarData]);



  /* ================= LOAD ROLE MAPPING ================= */

  const handleSearch = async (name?: string) => {
    const targetRole = name || roleName;
    // If empty do not fetch
    if (!targetRole) {
      alert("Please enter a role name to search");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=RolesDisplay`,
        { RoleName: targetRole }
      );

      const apiData = res.data || [];

      setModules((prevModules) =>
        prevModules.map((mod) => {
          const updatedSubs = mod.subModules.map((sub) => {
            const found = apiData.find(
              (item: any) =>
                item.MainModule?.trim().toLowerCase() === mod.module?.trim().toLowerCase() &&
                item.SubModule?.trim().toLowerCase() === sub.name?.trim().toLowerCase()
            );

            return {
              ...sub,
              dirty: false, // ✅ reset dirty
              permissions: found
                ? {
                  view: found.Viewed === "1",
                  add: found.Added === "1",
                  update: found.Updated === "1",
                  delete: found.Deleted === "1",
                }
                : createEmptyPermission(),
            };
          });

          return {
            ...mod,
            permissions: {
              view: updatedSubs.some((s) => s.permissions.view), // Changed to some for visibility
              add: updatedSubs.every((s) => s.permissions.add),
              update: updatedSubs.every((s) => s.permissions.update),
              delete: updatedSubs.every((s) => s.permissions.delete),
            },
            subModules: updatedSubs,
          };
        })
      );
    } catch (error) {
      console.error("Roles fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ROLE ================= */
  const handleDeleteRole = async (targetRole?: string) => {
    const roleToDelete = targetRole || roleName;
    if (!roleToDelete) {
      alert("Please select a role to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${roleToDelete}"? This will remove all associated permissions.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=DeleteRoles`,
        { RoleName: roleToDelete }
      );

      alert("Role deleted successfully");

      // Refresh list
      const res = await axios.post(
        `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=GetRoles`
      );
      if (res.data && Array.isArray(res.data)) {
        setRolesList(res.data);
      }

      // Reset state if deleted role was the selected or input role
      if (roleToDelete === roleName) {
        setRoleName("");
        setSelectedRole("");
        setModules((prev) =>
          prev.map((mod) => ({
            ...mod,
            permissions: createEmptyPermission(),
            subModules: mod.subModules.map((sub) => ({
              ...sub,
              permissions: createEmptyPermission(),
              dirty: false,
            })),
          }))
        );
      }
    } catch (error) {
      console.error("Delete role failed", error);
      alert("Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE ROLE MAPPING ================= */
  const handleSavePermissions = async () => {
    if (!roleName) {
      alert("Please enter a role name first");
      return;
    }

    try {
      setLoading(true);

      const savePromises: any[] = [];

      for (const mod of modules) {
        for (const sub of mod.subModules) {
          savePromises.push(
            axios.post(
              `https://norisapi.noris.in/Crusher/RolesMapping.php?ID=${id}&TableName=AddRolesToLogin`,
              {
                RoleName: roleName,
                MainModule: mod.module,
                SubModule: sub.name,
                Viewed: sub.permissions.view ? "1" : "0",
                Added: sub.permissions.add ? "1" : "0",
                Updated: sub.permissions.update ? "1" : "0",
                Deleted: sub.permissions.delete ? "1" : "0",
              }
            )
          );
        }
      }

      await Promise.all(savePromises);

      // ✅ RESET DIRTY AFTER SAVE
      setModules((prev) =>
        prev.map((mod) => ({
          ...mod,
          subModules: mod.subModules.map((sub) => ({
            ...sub,
            dirty: false,
          })),
        }))
      );

      alert("Permissions saved successfully");
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHECKBOX HANDLERS ================= */

  const handleParentChange = (
    moduleIndex: number,
    type: keyof Permission
  ) => {
    setModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== moduleIndex) return mod;

        const newValue = !mod.permissions[type];

        return {
          ...mod,
          permissions: { ...mod.permissions, [type]: newValue },
          subModules: mod.subModules.map((sub) => ({
            ...sub,
            dirty: true, // ✅ mark changed
            permissions: { ...sub.permissions, [type]: newValue },
          })),
        };
      })
    );
  };

  const handleChildChange = (
    moduleIndex: number,
    subIndex: number,
    type: keyof Permission
  ) => {
    setModules((prev) =>
      prev.map((mod, mIdx) => {
        if (mIdx !== moduleIndex) return mod;

        const updatedSubs = mod.subModules.map((sub, sIdx) => {
          if (sIdx !== subIndex) return sub;

          return {
            ...sub,
            dirty: true, // ✅ mark changed
            permissions: {
              ...sub.permissions,
              [type]: !sub.permissions[type],
            },
          };
        });

        return {
          ...mod,
          permissions: {
            view: updatedSubs.every((s) => s.permissions.view),
            add: updatedSubs.every((s) => s.permissions.add),
            update: updatedSubs.every((s) => s.permissions.update),
            delete: updatedSubs.every((s) => s.permissions.delete),
          },
          subModules: updatedSubs,
        };
      })
    );
  };

  /* ================= UI ================= */

  return (
    <div className="page-wrapper">
      <div className="content p-3">

        <Card className="p-3 shadow-sm mb-3">
          <h4>Enter Role Name</h4>
          <div className="d-flex gap-2 w-100">
            {/* 🔽 Dropdown */}
            <div style={{ flex: 1 }}>
              <Select
                isSearchable
                isClearable
                placeholder="Select Existing Role"
                options={roleOptions}
                value={
                  roleOptions.find((r) => r.value === selectedRole) || null
                }
                onChange={(opt) => {
                  const value = opt ? opt.value : "";
                  setSelectedRole(value);
                  setRoleName(value); // sync to API
                }}
              />
            </div>

            {/* ✍️ Manual Input */}
            <div style={{ flex: 1 }}>
              <Form.Control
                type="text"
                placeholder="Or Enter New Role"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setSelectedRole(""); // clear dropdown if typing
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
            </div>

            {/* 🔍 Search Button */}
            <Button variant="primary" onClick={() => handleSearch()} disabled={loading}>
              Search
            </Button>

            {/* 🗑️ Delete Button */}
            <Button
              variant="danger"
              onClick={() => handleDeleteRole()}
              disabled={loading || !roleName}
            >
              <i className="ti ti-trash me-1"></i> Delete
            </Button>
          </div>
        </Card>


        <Card className="p-3 shadow-sm">
          <h4 className="mb-3">Role Permissions</h4>

          {loading && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" />
            </div>
          )}

          <div className="table-responsive">
            <Table bordered hover>
              <thead className="table-light text-center">
                <tr>
                  <th className="text-start" style={{ width: "40%" }}>
                    Module / Sub Module
                  </th>
                  <th style={{ width: "15%" }}>View</th>
                  <th style={{ width: "15%" }}>Add</th>
                  <th style={{ width: "15%" }}>Update</th>
                  <th style={{ width: "15%" }}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {modules.map((mod, moduleIndex) => (
                  <React.Fragment key={mod.module}>
                    <tr className="table-primary fw-bold">
                      <td>{mod.module}</td>
                      {(["view", "add", "update", "delete"] as (keyof Permission)[]).map((perm) => (
                        <td key={perm} className="text-center">
                          <Form.Check
                            type="checkbox"
                            checked={mod.permissions[perm]}
                            onChange={() =>
                              handleParentChange(moduleIndex, perm)
                            }
                            className="d-flex justify-content-center"
                          />
                        </td>
                      ))}
                    </tr>

                    {mod.subModules.map((sub, subIndex) => (
                      <tr key={sub.name}>
                        <td className="ps-4">{sub.displayName}</td>
                        {(["view", "add", "update", "delete"] as (keyof Permission)[]).map((perm) => (
                          <td key={perm} className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={sub.permissions[perm]}
                              onChange={() =>
                                handleChildChange(
                                  moduleIndex,
                                  subIndex,
                                  perm
                                )
                              }
                              className="d-flex justify-content-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="text-end mt-3">
            <Button variant="primary" onClick={handleSavePermissions} disabled={loading}>
              {loading ? "Saving..." : "Save Permissions"}
            </Button>
          </div>

        </Card>
      </div>
    </div>
  );
};

export default Roles;

