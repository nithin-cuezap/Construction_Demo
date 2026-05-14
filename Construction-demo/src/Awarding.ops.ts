import type { Assignment, AwardingDataState } from "./types";

export function getDecisionAssignment(
  awardingData: AwardingDataState,
  itemId: string,
): Pick<Assignment, "carried" | "backups"> {
  return awardingData.decisionsByItemId[itemId] ?? { carried: [], backups: [] };
}

export function removeAwardingSub(
  awardingData: AwardingDataState,
  activeItemId: string,
  zone: "carried" | "backup",
  subId: string,
): AwardingDataState {
  const currentDecision = getDecisionAssignment(awardingData, activeItemId);
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

  return {
    ...awardingData,
    decisionsByItemId: {
      ...awardingData.decisionsByItemId,
      [activeItemId]: nextDecision,
    },
  };
}
