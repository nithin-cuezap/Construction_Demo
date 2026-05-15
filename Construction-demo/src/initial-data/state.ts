/**
 * @fileoverview Initial state data for workflow stages.
 *
 * Provides empty/default state objects for the selection, bidding, and awarding
 * workflow stages. Also defines the initial workflow stage shown on app load.
 *
 * @module initial-data/state
 */

import type {
  AwardingDataState,
  BidDataState,
  SelectionDataState,
} from "../types";

/**
 * Initial workflow stage shown when the app loads.
 * Set to "TenderPackages" to show the tender package list view.
 */
export const INITIAL_WORKFLOW_STAGE = "TenderPackages" as const;

/**
 * Initial empty state for the contractor selection stage.
 * No work items have review lists yet.
 */
export const INITIAL_SELECTION_DATA: SelectionDataState = {
  reviewByItemId: {},
};

/**
 * Initial empty state for the bid invitation/tracking stage.
 * No bid records exist yet.
 */
export const INITIAL_BID_DATA: BidDataState = {
  bidRecords: [],
};

/**
 * Initial empty state for the contract awarding stage.
 * No awarding decisions have been made yet.
 */
export const INITIAL_AWARDING_DATA: AwardingDataState = {
  decisionsByItemId: {},
};
