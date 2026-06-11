import { useState } from "react";
import { Link } from "react-router-dom";

// A generic interface for a data row
interface DashboardListRow {
  [key: string]: string | number | null | undefined;
}

interface DashboardListProps {
  title: string;
  periodOptions: string[];
  tableHeaders: string[];
  dealsData: DashboardListRow[];
  linkField?: string;
  linkRoute?: string;
  columnTypes?: { [key: string]: 'string' | 'number' }; // ✅ Fixed type
  statusField?: string;
}

const DashboardList = ({
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

  // Calculate pagination values
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
        <div className="card-body">

          <div className="table-responsive custom-table">
            <table className="table dataTable table-nowrap no-footer w-100">
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th
                      key={index}
                      className={`sorting_disabled bg-primary bg-opacity-10 text-primary py-3 ${columnTypes?.[header] === 'number' ? 'text-end' : 'text-start'
                        }`} rowSpan={1}
                      colSpan={1}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentDeals.length > 0 ? (
                  currentDeals.map((deal, index) => (
                    <tr
                      key={index}
                      className={`${index % 2 === 0 ? "odd" : "even"
                        } align-middle`}
                    >
                      {Object.keys(deal).map((key, i) => (
                        <td key={i} className={`text-dark py-3 ${columnTypes?.[key] === 'number' ? 'text-end' : 'text-start'
                          }`}>

                          {linkField && key === linkField ? (
                            <Link
                              to={linkRoute || "#"}
                              className="text-primary text-decoration-none"
                            >
                              {deal[key]}
                            </Link>
                          ) : statusField && key === statusField ? (
                            <span
                              className={`badge rounded-pill px-3 py-2 ${getStatusBadgeColor(
                                String(deal[key])
                              )}`}
                            >
                              {deal[key]}
                            </span>
                          ) : (
                            <span className="text-dark">{deal[key]}</span>
                          )}
                        </td>
                      ))}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li
                    key={page}
                    className={`page-item ${page === currentPage ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
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

export default DashboardList;
