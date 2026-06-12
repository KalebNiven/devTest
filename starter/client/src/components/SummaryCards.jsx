function SummaryCards({ data, loading }) {
  const cards = [
    {
      title: "Total Sales",
      value: data?.summary?.totalSales ?? 0,
      format: "number",
      color: "blue",
    },
    {
      title: "Total Revenue",
      value: data?.summary?.totalRevenue ?? 0,
      format: "currency",
      color: "green",
    },
    {
      title: "Avg Order Value",
      value: data?.summary?.avgOrderValue ?? 0,
      format: "currency",
      color: "purple",
    },
    {
      title: "Total Refunds",
      value: data?.summary?.totalRefunds ?? 0,
      format: "currency",
      color: "red",
    },
  ];

  const formatValue = (value, format) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return new Intl.NumberFormat("en-US").format(value);
  };

  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-lg border p-4 ${colorClasses[card.color]}`}
        >
          <p className="text-sm font-medium opacity-75">{card.title}</p>
          {loading ? (
            <div className="h-8 mt-1 bg-current opacity-10 rounded animate-pulse w-24" />
          ) : (
            <p className="text-2xl font-bold mt-1">
              {formatValue(card.value, card.format)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
