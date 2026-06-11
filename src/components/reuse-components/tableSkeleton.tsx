

interface TableSkeletonProps {
    columns: number;      // number of columns in the table
    rows?: number;        // how many skeleton rows to show
    showActions?: boolean; // if last column is an actions column
}

const TableSkeleton = ({ columns, rows = 6, showActions = false }: TableSkeletonProps) => {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="py-3">
                            <div className="placeholder-wave">
                                <span className="placeholder col-8"></span>
                            </div>
                        </td>
                    ))}

                    {showActions && (
                        <td className="py-3 text-center">
                            <div className="placeholder-wave">
                                <span className="placeholder col-4"></span>
                            </div>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    );
};

export default TableSkeleton;
