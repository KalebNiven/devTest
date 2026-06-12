import { useState } from "react";
import { useDebouncedCallback } from "../hooks/useDebounce";
import DateRangePicker from "./DateRangePicker";

function FiltersPanel({ filters, filterOptions, onFilterChange }) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // BUG (intentional): Uses the buggy useDebouncedCallback which has a stale closure.
  // When the user types fast, the debounced function may fire with old search values
  // because the callback captures the initial `onFilterChange` closure.
  const debouncedSearch = useDebouncedCallback((value) => {
    onFilterChange("search", value);
  }, 300);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        <button
          onClick={() => {
            setSearchInput("");
            onFilterChange("search", "");
            onFilterChange("status", "");
            onFilterChange("region", "");
            onFilterChange("category", "");
            onFilterChange("startDate", "");
            onFilterChange("endDate", "");
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <input
            id="search"
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by name or SKU..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            {filterOptions.statuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={filters.region}
            onChange={(e) => onFilterChange("region", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Regions</option>
            {filterOptions.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div className="mt-4">
        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(value) => onFilterChange("startDate", value)}
          onEndDateChange={(value) => onFilterChange("endDate", value)}
        />
      </div>
    </div>
  );
}

export default FiltersPanel;
