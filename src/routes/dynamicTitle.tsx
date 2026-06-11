import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { publicRoutes, authRoutes } from "./router.link";

type RouteWithMeta = {
  path: string;
  element: React.ReactElement;
  route: (_props: any) => React.ReactElement | null;
  meta_title?: string;
};

const allRoutes: RouteWithMeta[] = [...publicRoutes, ...authRoutes];

export default function DynamicTitle() {
  const location = useLocation();

  useEffect(() => {
    // ✅ SAME SOURCE AS HEADER
    const company = JSON.parse(
      sessionStorage.getItem("selectedItems1") || "null"
    );

    const companyName = company?.Name || "Application";

    const currentRoute = allRoutes.find(
      (route) => route.path === location.pathname
    );

    if (currentRoute?.meta_title) {
      document.title = `${currentRoute.meta_title} | ${companyName}`;
    } else {
      document.title = companyName;
    }
  }, [location.pathname]);

  return null;
}
