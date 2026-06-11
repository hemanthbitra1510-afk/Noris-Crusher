import { useState } from "react";
import { Link } from "react-router-dom";

interface DashboardListRow {
  [key: string]: string | number | null | undefined;
}

interface TableHeader {
  Label: string;
  Key: string;
  Type: "string" | "number" | "Amount" | "net";
}

interface DashboardListProps {
  title: string;
  periodOptions: string[];
  tableHeaders: TableHeader[];
  dealsData: DashboardListRow[];
  linkField?: string;
  linkRoute?: string;
  columnTypes?: { [key: string]: "string" | "number" | "Amount" | "net" };
  statusField?: string;
}

const DashboardList2 = ({
  title,
  periodOptions,
  tableHeaders,
  dealsData,
  linkField,
  linkRoute,
  columnTypes,
  statusField,
}: DashboardListProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const getStatusBadgeColor = (status: string) => {
    return status === "Won" ? "bg-success" : "bg-danger";
  };

  const formatIndianCurrency = (
    num: number | string | null | undefined,
    fieldType?: "string" | "number" | "Amount" | "net"
  ) => {
    if (num == null || num === "") return <></>;
    const cleanNum = String(num).replace(/,/g, "").trim();
    const number = Number(cleanNum);
    if (isNaN(number)) return <>{String(num)}</>;

    let formatted: string;

    if (fieldType === "net") {
      // Net → 3–4 decimals
      formatted = number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else if (fieldType === "Amount") {
      // Amount → Always 2 decimals + ₹ symbol
      formatted = number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (
        <>
          <span style={{ color: "green", fontWeight: 500 }}>₹</span> {formatted}
        </>
      );
    } else if (fieldType === "number") {
      // Number → 2–4 decimals
      formatted = number.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });
    } else {
      // Default → show without formatting
      return <>{num}</>;
    }

    return <>{formatted}</>;
  };

  const totalPages = Math.ceil(dealsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDeals = dealsData.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="d-flex">
      <div className="card flex-fill">
        {/* Card Header */}
        <div className="card-header bg-primary bg-opacity-10 d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h6 className="mb-0 text-primary">{title}</h6>
          <div className="dropdown">
            <Link
              className="dropdown-toggle btn btn-outline-light shadow"
              data-bs-toggle="dropdown"
              to="#"
            >
              {periodOptions[0]}
            </Link>
            <div className="dropdown-menu dropdown-menu-end">
              {periodOptions.map((option, index) => (
                <Link key={index} to="#" className="dropdown-item">
                  {option}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Card Body - Table */}
        <div className="card-body">
          <div className="table-responsive custom-table">
            <table className="table dataTable table-nowrap no-footer w-100">
              <thead>
                <tr>
                  {tableHeaders.map(({ Label, Key }, index) => (
                    <th
                      key={index}
                      className={`sorting_disabled bg-primary bg-opacity-10 text-primary py-3 ${
                        columnTypes?.[Key] === "number" ||
                        columnTypes?.[Key] === "Amount" ||
                        columnTypes?.[Key] === "net"
                          ? "text-end"
                          : "text-start"
                      }`}
                    >
                      {Label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentDeals.length > 0 ? (
                  currentDeals.map((deal, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "odd" : "even"
                      } align-middle`}
                    >
                      {tableHeaders.map(({ Key }, i) => {
                        const fieldType = columnTypes?.[Key];
                        const content =
                          fieldType === "number" ||
                          fieldType === "Amount" ||
                          fieldType === "net"
                            ? formatIndianCurrency(deal[Key], fieldType)
                            : deal[Key];

                        return (
                          <td
                            key={i}
                            className={`text-dark py-3 ${
                              fieldType === "number" ||
                              fieldType === "Amount" ||
                              fieldType === "net"
                                ? "text-end"
                                : "text-start"
                            }`}
                          >
                            {linkField && Key === linkField ? (
                              <Link
                                to={linkRoute || "#"}
                                className="text-primary text-decoration-none"
                              >
                                {content}
                              </Link>
                            ) : statusField && Key === statusField ? (
                              <span
                                className={`badge rounded-pill px-3 py-2 ${getStatusBadgeColor(
                                  String(deal[Key])
                                )}`}
                              >
                                {content}
                              </span>
                            ) : (
                              <span>{content}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="text-center py-5"
                    >
                      <i className="bi bi-search display-6 text-muted d-block mb-2"></i>
                      <span className="text-muted">No data available</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer d-flex justify-content-center">
            <nav>
              <ul className="pagination flex-wrap mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {(() => {
  const pages = [];
  const maxVisible = 3;

  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPages, currentPage + 1);

  if (currentPage <= 2) {
    start = 1;
    end = Math.min(totalPages, maxVisible);
  }

  if (currentPage >= totalPages - 1) {
    start = Math.max(1, totalPages - maxVisible + 1);
    end = totalPages;
  }

  // First page
  if (start > 1) {
    pages.push(
      <li key={1} className="page-item">
        <button className="page-link" onClick={() => setCurrentPage(1)}>
          1
        </button>
      </li>
    );

    if (start > 2) {
      pages.push(
        <li key="start-ellipsis" className="page-item disabled">
          <span className="page-link">...</span>
        </li>
      );
    }
  }

  // Middle pages
  for (let i = start; i <= end; i++) {
    pages.push(
      <li
        key={i}
        className={`page-item ${i === currentPage ? "active" : ""}`}
      >
        <button className="page-link" onClick={() => setCurrentPage(i)}>
          {i}
        </button>
      </li>
    );
  }

  // Last page
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push(
        <li key="end-ellipsis" className="page-item disabled">
          <span className="page-link">...</span>
        </li>
      );
    }

    pages.push(
      <li key={totalPages} className="page-item">
        <button
          className="page-link"
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      </li>
    );
  }

  return pages;
})()}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardList2;
