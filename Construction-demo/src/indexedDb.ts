/**
 * @fileoverview IndexedDB persistence layer using Dexie.js
 *
 * This module provides a persistent storage layer for the application using IndexedDB
 * through the Dexie.js library. It stores all application state locally in the browser,
 * enabling offline functionality and preparing for Progressive Web App capabilities.
 *
 * The database schema mirrors the mockDb structure and automatically syncs changes
 * to IndexedDB for persistence across browser sessions.
 *
 * @module indexedDb
 */

import Dexie, { type EntityTable } from "dexie";
import type {
  AwardingDataState,
  BidDataState,
  SelectionDataState,
  Subcontractor,
  TenderPackage,
  WorkItem,
} from "./types";
import type { WorkflowStage } from "./mockDb";

/**
 * Interface representing the application settings stored in IndexedDB.
 * Currently stores the active workflow stage.
 *
 * @interface AppSettings
 */
interface AppSettings {
  id: string; // Primary key (always 'settings' for singleton pattern)
  workflowStage: WorkflowStage;
}

/**
 * Interface representing work items collection with package association.
 *
 * @interface WorkItemsCollection
 */
interface WorkItemsCollection {
  tenderPackageId: string; // Primary key
  workItems: WorkItem[];
}

/**
 * Interface representing the selection data state in IndexedDB.
 *
 * @interface SelectionDataRecord
 */
interface SelectionDataRecord {
  id: string; // Primary key (always 'current' for singleton pattern)
  data: SelectionDataState;
}

/**
 * Interface representing the bid data state in IndexedDB.
 *
 * @interface BidDataRecord
 */
interface BidDataRecord {
  id: string; // Primary key (always 'current' for singleton pattern)
  data: BidDataState;
}

/**
 * Interface representing the awarding data state in IndexedDB.
 *
 * @interface AwardingDataRecord
 */
interface AwardingDataRecord {
  id: string; // Primary key (always 'current' for singleton pattern)
  data: AwardingDataState;
}

/**
 * Dexie database class for the Construction Demo application.
 * Defines the schema and provides typed table access.
 *
 * @class ConstructionDB
 * @extends {Dexie}
 */
class ConstructionDB extends Dexie {
  // Typed table declarations
  settings!: EntityTable<AppSettings, "id">;
  workItemsCollections!: EntityTable<WorkItemsCollection, "tenderPackageId">;
  subcontractors!: EntityTable<Subcontractor, "id">;
  selectionData!: EntityTable<SelectionDataRecord, "id">;
  bidData!: EntityTable<BidDataRecord, "id">;
  awardingData!: EntityTable<AwardingDataRecord, "id">;
  tenderPackages!: EntityTable<TenderPackage, "id">;

  constructor() {
    super("ConstructionDemoDB");

    // Define database schema
    // Version 1: Initial schema
    this.version(1).stores({
      settings: "id", // Singleton store for app settings
      workItemsCollections: "tenderPackageId", // Work items indexed by tender package
      subcontractors: "id, name", // Vendor database
      selectionData: "id", // Singleton store for selection workflow data
      bidData: "id", // Singleton store for bid workflow data
      awardingData: "id", // Singleton store for awarding workflow data
      tenderPackages: "id, packageControlNumber", // All tender packages
    });
  }
}

/**
 * Singleton instance of the ConstructionDB database.
 *
 * @constant {ConstructionDB} db
 */
export const db = new ConstructionDB();

/**
 * IndexedDB persistence API providing async operations for all data entities.
 * All operations return Promises and use Dexie's transaction system for consistency.
 *
 * @namespace indexedDbApi
 */
export const indexedDbApi = {
  /**
   * Gets the current workflow stage from IndexedDB.
   *
   * @returns {Promise<WorkflowStage | undefined>} The current workflow stage, or undefined if not set
   */
  async getWorkflowStage(): Promise<WorkflowStage | undefined> {
    const settings = await db.settings.get("settings");
    return settings?.workflowStage;
  },

  /**
   * Saves the workflow stage to IndexedDB.
   *
   * @param {WorkflowStage} stage - The workflow stage to save
   * @returns {Promise<void>}
   */
  async setWorkflowStage(stage: WorkflowStage): Promise<void> {
    await db.settings.put({ id: "settings", workflowStage: stage });
  },

  /**
   * Gets all work items for a specific tender package from IndexedDB.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @returns {Promise<WorkItem[]>} Array of work items (empty array if not found)
   */
  async getWorkItems(tenderPackageId: string): Promise<WorkItem[]> {
    const collection = await db.workItemsCollections.get(tenderPackageId);
    return collection?.workItems ?? [];
  },

  /**
   * Saves work items for a specific tender package to IndexedDB.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @param {WorkItem[]} workItems - The work items to save
   * @returns {Promise<void>}
   */
  async setWorkItems(
    tenderPackageId: string,
    workItems: WorkItem[],
  ): Promise<void> {
    await db.workItemsCollections.put({ tenderPackageId, workItems });
  },

  /**
   * Deletes all work items for a tender package from IndexedDB.
   *
   * @param {string} tenderPackageId - The ID of the tender package
   * @returns {Promise<void>}
   */
  async deleteWorkItems(tenderPackageId: string): Promise<void> {
    await db.workItemsCollections.delete(tenderPackageId);
  },

  /**
   * Gets all subcontractors from IndexedDB.
   *
   * @returns {Promise<Subcontractor[]>} Array of all subcontractors
   */
  async getSubcontractors(): Promise<Subcontractor[]> {
    return await db.subcontractors.toArray();
  },

  /**
   * Saves all subcontractors to IndexedDB.
   * This replaces the entire subcontractors collection.
   *
   * @param {Subcontractor[]} subcontractors - Array of subcontractors to save
   * @returns {Promise<void>}
   */
  async setSubcontractors(subcontractors: Subcontractor[]): Promise<void> {
    await db.transaction("rw", db.subcontractors, async () => {
      await db.subcontractors.clear();
      await db.subcontractors.bulkAdd(subcontractors);
    });
  },

  /**
   * Gets the selection data from IndexedDB.
   *
   * @returns {Promise<SelectionDataState | undefined>} The selection data, or undefined if not set
   */
  async getSelectionData(): Promise<SelectionDataState | undefined> {
    const record = await db.selectionData.get("current");
    return record?.data;
  },

  /**
   * Saves the selection data to IndexedDB.
   *
   * @param {SelectionDataState} data - The selection data to save
   * @returns {Promise<void>}
   */
  async setSelectionData(data: SelectionDataState): Promise<void> {
    await db.selectionData.put({ id: "current", data });
  },

  /**
   * Gets the bid data from IndexedDB.
   *
   * @returns {Promise<BidDataState | undefined>} The bid data, or undefined if not set
   */
  async getBidData(): Promise<BidDataState | undefined> {
    const record = await db.bidData.get("current");
    return record?.data;
  },

  /**
   * Saves the bid data to IndexedDB.
   *
   * @param {BidDataState} data - The bid data to save
   * @returns {Promise<void>}
   */
  async setBidData(data: BidDataState): Promise<void> {
    await db.bidData.put({ id: "current", data });
  },

  /**
   * Gets the awarding data from IndexedDB.
   *
   * @returns {Promise<AwardingDataState | undefined>} The awarding data, or undefined if not set
   */
  async getAwardingData(): Promise<AwardingDataState | undefined> {
    const record = await db.awardingData.get("current");
    return record?.data;
  },

  /**
   * Saves the awarding data to IndexedDB.
   *
   * @param {AwardingDataState} data - The awarding data to save
   * @returns {Promise<void>}
   */
  async setAwardingData(data: AwardingDataState): Promise<void> {
    await db.awardingData.put({ id: "current", data });
  },

  /**
   * Gets all tender packages from IndexedDB.
   *
   * @returns {Promise<TenderPackage[]>} Array of all tender packages
   */
  async getTenderPackages(): Promise<TenderPackage[]> {
    return await db.tenderPackages.toArray();
  },

  /**
   * Saves all tender packages to IndexedDB.
   * This replaces the entire tender packages collection.
   *
   * @param {TenderPackage[]} packages - Array of tender packages to save
   * @returns {Promise<void>}
   */
  async setTenderPackages(packages: TenderPackage[]): Promise<void> {
    await db.transaction("rw", db.tenderPackages, async () => {
      await db.tenderPackages.clear();
      await db.tenderPackages.bulkAdd(packages);
    });
  },

  /**
   * Checks if the database has any persisted data.
   * Used to determine if initial data should be loaded.
   *
   * @returns {Promise<boolean>} True if database has data, false if empty
   */
  async hasPersistedData(): Promise<boolean> {
    const packageCount = await db.tenderPackages.count();
    return packageCount > 0;
  },

  /**
   * Clears all data from the database.
   * Useful for testing or resetting the application state.
   *
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    await db.transaction(
      "rw",
      [
        db.settings,
        db.workItemsCollections,
        db.subcontractors,
        db.selectionData,
        db.bidData,
        db.awardingData,
        db.tenderPackages,
      ],
      async () => {
        await db.settings.clear();
        await db.workItemsCollections.clear();
        await db.subcontractors.clear();
        await db.selectionData.clear();
        await db.bidData.clear();
        await db.awardingData.clear();
        await db.tenderPackages.clear();
      },
    );
  },
};
