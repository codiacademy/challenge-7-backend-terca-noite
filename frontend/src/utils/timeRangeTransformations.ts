export function convertTimeRangeToParams(
  tr: string | { type: "custom"; startDate: Date; endDate: Date } | undefined,
) {
  const now = new Date();
  let from: string | undefined;
  let to: string | undefined;
  if (tr) {
    if (typeof tr === "string") {
      // trata os casos string do seu TimeRange
      switch (tr) {
        case "lastWeek": {
          const start = new Date();
          start.setDate(now.getDate() - 7);
          from = start.toISOString();
          to = now.toISOString();
          break;
        }
        case "thisMonth": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          from = start.toISOString();
          to = now.toISOString();
          break;
        }
        case "lastThreeMonths": {
          const start = new Date();
          start.setMonth(now.getMonth() - 3);
          from = start.toISOString();
          to = now.toISOString();
          break;
        }
        case "thisYear": {
          const start = new Date(now.getFullYear(), 0, 1);
          from = start.toISOString();
          to = now.toISOString();
          break;
        }
        case "all": {
          // deixa from/to indefinidos para trazer tudo (ou o back decide)
          break;
        }
        default: {
          // caso seu TimeRange tenha outros valores string
          break;
        }
      }
    } else if (typeof tr === "object" && tr.type === "custom") {
      // custom com datas já em Date
      from = tr.startDate.toISOString();
      to = tr.endDate.toISOString();
    }
  }
  return { from, to };
}
