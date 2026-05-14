import { mockDb, type WorkflowStage } from "./mockDb";
import type { TenderPackage } from "./types";

export type { WorkflowStage } from "./mockDb";

export function getWorkflowStageData(): WorkflowStage {
  return mockDb.getWorkflowStage();
}

export function setWorkflowStageData(stage: WorkflowStage) {
  mockDb.setWorkflowStage(stage);
}

export function getTenderPackagesData(): TenderPackage[] {
  return mockDb.getTenderPackages();
}

export function setTenderPackagesData(tenderPackages: TenderPackage[]) {
  mockDb.setTenderPackages(tenderPackages);
}

export function getNextPackageControlNumber(): string {
  return mockDb.generatePackageControlNumber();
}

export function savePackage(
  tenderPackages: TenderPackage[],
  packageData: TenderPackage,
  editingPackageId: string | null,
): TenderPackage[] {
  const packageWithTransition = {
    ...packageData,
    updatedAt: new Date().toISOString(),
  };

  if (editingPackageId) {
    return tenderPackages.map((pkg) =>
      pkg.id === editingPackageId ? packageWithTransition : pkg,
    );
  }

  return [
    ...tenderPackages,
    { ...packageWithTransition, createdAt: new Date().toISOString() },
  ];
}

export function deletePackage(
  tenderPackages: TenderPackage[],
  packageId: string,
): TenderPackage[] {
  return tenderPackages.filter((pkg) => pkg.id !== packageId);
}
