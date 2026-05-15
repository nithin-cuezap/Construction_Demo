import type {
  AwardingDataState,
  BidDataState,
  SelectionDataState,
} from "../types";

export const INITIAL_WORKFLOW_STAGE = "TenderPackages" as const;

export const INITIAL_SELECTION_DATA: SelectionDataState = {
  reviewByItemId: {},
};

export const INITIAL_BID_DATA: BidDataState = {
  bidRecords: [],
};

export const INITIAL_AWARDING_DATA: AwardingDataState = {
  decisionsByItemId: {},
};
