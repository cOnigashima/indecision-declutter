import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  CandidateList: undefined;
  DiscardedList: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Capture: undefined;
  EvacuationComplete: { itemId?: string; returnTo?: 'capture' | 'candidate' } | undefined;
  ItemDetail: { itemId: string };
  ItemEdit: { itemId: string };
  PhotoViewer: { itemId: string; index: number };
  ReleaseConfirm: { itemId: string };
  ReleaseComplete: { itemId: string };
  DiscardedDetail: { itemId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
