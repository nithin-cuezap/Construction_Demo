import type { WorkItem } from "../types";

export const INITIAL_WORK_ITEM_TEMPLATES: Array<
  Pick<WorkItem, "sectionCode" | "sectionName" | "description">
> = [
  {
    sectionCode: "03 30 00",
    sectionName: "Cast-in-Place Concrete",
    description: "Concrete structural forming and placement",
  },
  {
    sectionCode: "09 22 00",
    sectionName: "Metal Supports for Plaster",
    description: "Metal support framing for plaster and gypsum board",
  },
  {
    sectionCode: "09 90 00",
    sectionName: "Painting and Coating",
    description: "Interior and exterior painting and coating work",
  },
  {
    sectionCode: "26 05 00",
    sectionName: "Common Work Results for Electrical",
    description: "Electrical conduit, wiring, and common installations",
  },
];

export const createInitialWorkItemsForPackage = (
  tenderPackageId: string,
): WorkItem[] =>
  INITIAL_WORK_ITEM_TEMPLATES.map((template, index) => ({
    id: `${tenderPackageId}-wi-${index + 1}`,
    tenderPackageId,
    sectionCode: template.sectionCode,
    sectionName: template.sectionName,
    description: template.description,
    status: "Draft",
  }));
