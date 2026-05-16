/**
 * @fileoverview Operations for managing tender packages and workflow stages.
 *
 * This module provides business logic functions for creating, reading, updating, and deleting
 * tender packages. It also manages the global workflow stage navigation state.
 * Functions in this module interact with the mock database layer to persist changes.
 *
 * @module TenderPackage.ops
 */

import { mockDb, type WorkflowStage } from "./mockDb";
import type { Subcontractor, TenderPackage } from "./types";

export type { WorkflowStage } from "./mockDb";

/**
 * Retrieves the current active workflow stage from the database.
 *
 * @returns {WorkflowStage} The current workflow stage identifier
 */
export function getWorkflowStageData(): WorkflowStage {
  return mockDb.getWorkflowStage();
}

/**
 * Updates the active workflow stage (main navigation view).
 *
 * @param {WorkflowStage} stage - The new workflow stage to activate
 */
export function setWorkflowStageData(stage: WorkflowStage) {
  mockDb.setWorkflowStage(stage);
}

/**
 * Retrieves all tender packages from the database.
 *
 * @returns {TenderPackage[]} Array of all tender packages
 */
export function getTenderPackagesData(): TenderPackage[] {
  return mockDb.getTenderPackages();
}

/**
 * Replaces all tender packages in the database.
 * Used primarily for bulk updates or state synchronization.
 *
 * @param {TenderPackage[]} tenderPackages - The complete new array of tender packages
 */
export function setTenderPackagesData(tenderPackages: TenderPackage[]) {
  mockDb.setTenderPackages(tenderPackages);
}

/**
 * Generates a unique package control number for a new tender package.
 * Uses the database's generation logic to ensure uniqueness.
 *
 * @returns {string} A formatted package control number (e.g., "TP-001-20240515")
 */
export function getNextPackageControlNumber(): string {
  return mockDb.generatePackageControlNumber();
}

/**
 * Saves a tender package to the database, either creating a new one or updating an existing one.
 * Automatically manages timestamps (createdAt/updatedAt) and ensures work items are initialized.
 *
 * @param {TenderPackage[]} tenderPackages - The current array of all tender packages
 * @param {TenderPackage} packageData - The package data to save
 * @param {string | null} editingPackageId - The ID of the package being edited, or null for new packages
 * @returns {TenderPackage[]} Updated array of tender packages with the saved package included
 */
export function savePackage(
  tenderPackages: TenderPackage[],
  packageData: TenderPackage,
  editingPackageId: string | null,
): TenderPackage[] {
  // Update the updatedAt timestamp
  const packageWithTransition = {
    ...packageData,
    updatedAt: new Date().toISOString(),
  };

  // Update existing package
  if (editingPackageId) {
    // Ensure work items exist for this package
    mockDb.ensureWorkItemsForPackage(packageWithTransition.id);
    return tenderPackages.map((pkg) =>
      pkg.id === editingPackageId ? packageWithTransition : pkg,
    );
  }

  // Create new package with creation timestamp
  const packageToInsert = {
    ...packageWithTransition,
    createdAt: new Date().toISOString(),
  };
  mockDb.ensureWorkItemsForPackage(packageToInsert.id);

  // Append to the end of the list
  return [...tenderPackages, packageToInsert];
}

/**
 * Deletes a tender package and all its associated data.
 * This cascades to remove work items, selection data, bid records, and awarding decisions.
 *
 * @param {TenderPackage[]} tenderPackages - The current array of all tender packages
 * @param {string} packageId - The ID of the package to delete
 * @returns {TenderPackage[]} Updated array with the deleted package removed
 */
export function deletePackage(
  tenderPackages: TenderPackage[],
  packageId: string,
): TenderPackage[] {
  // Cascade delete work items and related data
  mockDb.deleteWorkItemsForPackage(packageId);
  // Remove from the packages array
  return tenderPackages.filter((pkg) => pkg.id !== packageId);
}

/**
 * Retrieves a single tender package by its unique identifier.
 *
 * This function is used in the bid submission view to display project
 * details to vendors, including package name, description, site address,
 * and due dates. Returns null if the package doesn't exist, allowing
 * views to handle invalid package references gracefully.
 *
 * Acts as a convenience wrapper over mockDb.getTenderPackageById,
 * following the pattern where all database operations go through .ops.ts files.
 *
 * @param {string} tenderPackageId - The unique identifier of the tender package
 * @returns {TenderPackage | null} The tender package if found, or null if the package doesn't exist
 */
export function getTenderPackageById(
  tenderPackageId: string,
): TenderPackage | null {
  return mockDb.getTenderPackageById(tenderPackageId);
}

/**
 * Retrieves a single subcontractor by their unique identifier.
 *
 * This function is used in the bid submission view to display the
 * vendor's company name and verify their identity. Essential for
 * ensuring vendors see which company they're submitting on behalf of.
 * Returns null if the subcontractor doesn't exist.
 *
 * Acts as a convenience wrapper over mockDb.getSubcontractorById,
 * following the pattern where all database operations go through .ops.ts files.
 *
 * @param {string} subcontractorId - The unique identifier of the subcontractor
 * @returns {Subcontractor | null} The subcontractor if found, or null if the subcontractor doesn't exist
 */
export function getSubcontractorById(
  subcontractorId: string,
): Subcontractor | null {
  return mockDb.getSubcontractorById(subcontractorId);
}
