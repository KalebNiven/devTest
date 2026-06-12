import { useState, useEffect } from "react";
import { useSalesData } from "../hooks/useSalesData";
import { fetchFilters } from "../utils/api";
import FiltersPanel from "./FiltersPanel";
import SummaryCards from "./SummaryCards";
import SalesTable from "./SalesTable";
import SalesChart from "./SalesChart";
import ExportButton from "./ExportButton";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("sale_date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    categories: [],
    statuses: [],
  });

  // Load available filter options on mount
  useEffect(() => {
    fetchFilters()
      .then(setFilterOptions)
      .catch((err) => console.error("Failed to load filters:", err));
  }, []);

  // BUG (intentional): This creates a NEW object on every render.
  // useSalesData uses this as a useEffect dependency, causing an infinite loop.
  // The candidate needs to either memoize this object or restructure the hook.
  const filters = {
    search,
    status,
    region,
    category,
    startDate,
    endDate,
    page,
    sortBy,
    sortOrder,
  };

  const { salesData, summaryData, loading, error } = useSalesData(filters);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    // BUG (intentional): Sorting doesn't reset page to 1
    // If you're on page 5 and sort, you might get an empty page
  };

  const handleFilterChange = (filterName, value) => {
    switch (filterName) {
      case "search":
        setSearch(value);
        break;
      case "status":
        setStatus(value);
        break;
      case "region":
        setRegion(value);
        break;
      case "category":
        setCategory(value);
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "endDate":
        setEndDate(value);
        break;
      default:
        break;
    }
    // BUG (intentional): Changing filters doesn't reset page to 1
    // This means if you're on page 3 and apply a filter that only has 1 page
    // of results, you'll see an empty table.
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <h3 className="font-semibold">Error loading dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FiltersPanel
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Summary Cards */}
      <SummaryCards data={summaryData} loading={loading} />

      {/* Chart */}
      <SalesChart data={summaryData} startDate={startDate} endDate={endDate} />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {salesData.pagination?.total
            ? `Showing ${salesData.data?.length || 0} of ${salesData.pagination.total} results`
            : "Loading..."}
        </p>
        <ExportButton filters={filters} />
      </div>

      {/* Data Table */}
      <SalesTable
        data={salesData.data || []}
        pagination={salesData.pagination || {}}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default Dashboard;
