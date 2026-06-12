function SalesTable({ data, pagination, loading, sortBy, sortOrder, onSort, onPageChange }) {
  const columns = [
    { key: "sale_date", label: "Date", sortable: true },
    { key: "product_name", label: "Product", sortable: true },
    { key: "sku", label: "SKU", sortable: false },
    { key: "category_name", label: "Category", sortable: true },
    { key: "region_name", label: "Region", sortable: true },
    { key: "quantity", label: "Qty", sortable: true },
    { key: "unit_price", label: "Unit Price", sortable: true },
    { key: "total_amount", label: "Total", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    refunded: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const renderCell = (row, column) => {
    switch (column.key) {
      case "sale_date":
        return formatDate(row.sale_date);
      case "unit_price":
      case "total_amount":
        return formatCurrency(row[column.key]);
      case "status":
        return (
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              statusColors[row.status] || ""
            }`}
          >
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        );
      default:
        return row[column.key];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer hover:bg-gray-100 select-none" : ""
                  }`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-gray-400">{getSortIcon(col.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Basic loading state — candidate should replace with proper skeletons
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  No sales data found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    pageNum === pagination.page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesTable;
