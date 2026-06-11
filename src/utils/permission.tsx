type PermissionType = "Viewed" | "Added" | "Deleted" | "Updated";

interface PermissionItem {
  MainModule: string;
  SubModule: string;
  Viewed: string;
  Added: string;
  Deleted: string;
  Updated: string;
  RoleName?: string;
}

// 🔧 normalize helper (VERY IMPORTANT)
const normalize = (val: string) =>
  val?.toLowerCase().replace(/\s+/g, "").trim();

// ✅ Get all permissions
export const getPermissions = (): PermissionItem[] => {
  try {
    const data = JSON.parse(localStorage.getItem("permissions") || "[]");

    return data.filter(
      (item: PermissionItem) =>
        item.MainModule && item.SubModule
    );
  } catch {
    return [];
  }
};

// ✅ Check permission (STRICT 1 = allow, 0 = deny)
export const hasPermission = (
  mainModule: string,
  subModule: string,
  type: PermissionType
): boolean => {
  const permissions = getPermissions();

  const currentRole = normalize(localStorage.getItem("RoleName") || "");

  // 👑 OWNER OVERRIDE: Full access to all actions
  if (currentRole === "owner") return true;

  const module = permissions.find(
    (item) =>
      normalize(item.MainModule) === normalize(mainModule) &&
      normalize(item.SubModule) === normalize(subModule) &&
      normalize(item.RoleName) === currentRole
  );

  // 🔴 IMPORTANT LOGIC
  if (!module) return true; // ✅ NOT FOUND → DEFAULT FULL ACCESS

  return module[type] === "1"; // ✅ only "1" allowed
};

// ✅ Page-level access
export const checkPageAccess = (
  mainModule: string,
  subModule: string
) => {
  const permissions = getPermissions();

  // wait until loaded
  if (!permissions || permissions.length === 0) {
    return null;
  }

  const canView = hasPermission(mainModule, subModule, "Viewed");

  if (!canView) {
    return (
      <div className="text-center mt-5">
        <h5>Access Denied</h5>
      </div>
    );
  }

  return null;
};

// ✅ Find the first accessible route
export const getFirstAccessibleRoute = (sidebarData: any[]): string | null => {
  for (const group of sidebarData) {
    if (group.submenuItems) {
      for (const item of group.submenuItems) {
        const targetSub = item?.moduleName || item?.label;
        const targetMain = item?.parentModuleName || group.tittle;

        if (hasPermission(targetMain, targetSub, "Viewed")) {
          // If it has sub-items, check them too
          if (item.submenuItems && item.submenuItems.length > 0) {
            for (const sub of item.submenuItems) {
              const subTargetSub = sub?.moduleName || sub?.label;
              const subTargetMain = sub?.parentModuleName || targetSub;

              if (hasPermission(subTargetMain, subTargetSub, "Viewed") && sub.link) {
                return sub.link;
              }
            }
          } else if (item.link) {
            return item.link;
          }
        }
      }
    }
  }
  return null;
};