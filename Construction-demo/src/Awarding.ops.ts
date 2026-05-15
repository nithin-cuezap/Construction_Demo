/**
 * @fileoverview Operations for managing the contract awarding workflow stage.
 *
 * This module provides business logic for making final subcontractor assignment decisions
 * during the awarding stage. It manages the "carried" (primary) and "backup" (secondary)
 * subcontractor selections for each work item.
 *
 * @module Awarding.ops
 */

import type { Assignment, AwardingDataState } from "./types";

/**
 * Retrieves the awarding decision (carried and backup subcontractors) for a work item.
 * Returns an empty assignment if no decision has been made yet.
 *
 * @param {AwardingDataState} awardingData - The current awarding state
 * @param {string} itemId - The work item ID
 * @returns {Pick<Assignment, "carried" | "backups">} The assignment decision with carried and backup subcontractors
 */
export function getDecisionAssignment(
  awardingData: AwardingDataState,
  itemId: string,
): Pick<Assignment, "carried" | "backups"> {
  return awardingData.decisionsByItemId[itemId] ?? { carried: [], backups: [] };
}

/**
 * Removes a subcontractor from either the carried or backup list for a work item.
 * Returns a new awarding state with the specified subcontractor removed.
 *
 * @param {AwardingDataState} awardingData - The current awarding state
 * @param {string} activeItemId - The work item ID
 * @param {"carried" | "backup"} zone - Which assignment zone to remove from
 * @param {string} subId - The subcontractor ID to remove
 * @returns {AwardingDataState} New awarding state with the subcontractor removed
 */
export function removeAwardingSub(
  awardingData: AwardingDataState,
  activeItemId: string,
  zone: "carried" | "backup",
  subId: string,
): AwardingDataState {
  // Get the current decision for this work item
  const currentDecision = getDecisionAssignment(awardingData, activeItemId);

  // Create new decision with the subcontractor removed from the appropriate zone
  const nextDecision = {
    carried:
      zone === "carried"
        ? currentDecision.carried.filter((sub) => sub.id !== subId)
        : currentDecision.carried,
    backups:
      zone === "backup"
        ? currentDecision.backups.filter((sub) => sub.id !== subId)
        : currentDecision.backups,
  };

  // Return new state with updated decision
  return {
    ...awardingData,
    decisionsByItemId: {
      ...awardingData.decisionsByItemId,
      [activeItemId]: nextDecision,
    },
  };
}
