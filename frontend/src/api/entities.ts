export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "relation";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for type "select"
  relation?: { resource: string; labelKey: string }; // for type "relation"
  listValue?: (item: any) => string; // how to render this field in the list table
}

export interface EntityConfig {
  key: string; // API resource path
  label: string;
  fields: FieldConfig[];
}

export const entities: EntityConfig[] = [
  {
    key: "clients",
    label: "Clients",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "contactName", label: "Contact name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
    ],
  },
  {
    key: "sites",
    label: "Sites",
    fields: [
      {
        key: "clientId",
        label: "Client",
        type: "relation",
        required: true,
        relation: { resource: "clients", labelKey: "name" },
        listValue: (item) => item.client?.name ?? item.clientId,
      },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "address", label: "Address", type: "text" },
    ],
  },
  {
    key: "assets",
    label: "Assets",
    fields: [
      {
        key: "siteId",
        label: "Site",
        type: "relation",
        required: true,
        relation: { resource: "sites", labelKey: "name" },
        listValue: (item) => item.site?.name ?? item.siteId,
      },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "assetType", label: "Type", type: "text" },
      { key: "manufacturer", label: "Manufacturer", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "serialNumber", label: "Serial number", type: "text" },
    ],
  },
  {
    key: "maintenance-schedules",
    label: "Maintenance Schedules",
    fields: [
      {
        key: "assetId",
        label: "Asset",
        type: "relation",
        required: true,
        relation: { resource: "assets", labelKey: "name" },
        listValue: (item) => item.asset?.name ?? item.assetId,
      },
      {
        key: "frequency",
        label: "Frequency",
        type: "select",
        required: true,
        options: ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "CUSTOM"],
      },
      { key: "nextDueAt", label: "Next due", type: "date" },
    ],
  },
  {
    key: "jobs",
    label: "Jobs",
    fields: [
      {
        key: "siteId",
        label: "Site",
        type: "relation",
        required: true,
        relation: { resource: "sites", labelKey: "name" },
        listValue: (item) => item.site?.name ?? item.siteId,
      },
      { key: "title", label: "Title", type: "text", required: true },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["MAINTENANCE", "REPAIR", "INSPECTION"],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      },
      { key: "scheduledDate", label: "Scheduled date", type: "date" },
    ],
  },
  {
    key: "issues",
    label: "Issues",
    fields: [
      {
        key: "jobId",
        label: "Job",
        type: "relation",
        required: true,
        relation: { resource: "jobs", labelKey: "title" },
        listValue: (item) => item.job?.title ?? item.jobId,
      },
      { key: "description", label: "Description", type: "textarea", required: true },
      {
        key: "severity",
        label: "Severity",
        type: "select",
        options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["OPEN", "QUOTE_READY", "QUOTED", "RESOLVED"],
      },
    ],
  },
  {
    key: "inspection-forms",
    label: "Inspection Forms",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  {
    key: "parts",
    label: "Parts / Price List",
    fields: [
      { key: "sku", label: "SKU", type: "text", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "unit", label: "Unit", type: "text" },
      { key: "unitPrice", label: "Unit price", type: "number", required: true },
      { key: "category", label: "Category", type: "text" },
    ],
  },
  {
    key: "quote-items",
    label: "Quote Items",
    fields: [
      {
        key: "partId",
        label: "Part",
        type: "relation",
        relation: { resource: "parts", labelKey: "sku" },
        listValue: (item) => item.part?.sku ?? "",
      },
      { key: "description", label: "Description", type: "text", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unitPrice", label: "Unit price", type: "number", required: true },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["DRAFT", "QUOTE_READY", "QUOTED", "APPROVED", "REJECTED"],
      },
    ],
  },
];
