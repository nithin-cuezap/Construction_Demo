import type {
  AwardingDataState,
  InvitationDataState,
  SelectionDataState,
} from "../types";

export const INITIAL_WORKFLOW_STAGE = "TenderPackages" as const;

export const INITIAL_SELECTION_DATA: SelectionDataState = {
  reviewByItemId: {},
};

export const INITIAL_INVITATION_DATA: InvitationDataState = {
  notesByItemId: {},
  sentItemIds: [],
  invitationRecords: [],
};

export const INITIAL_AWARDING_DATA: AwardingDataState = {
  decisionsByItemId: {},
};
