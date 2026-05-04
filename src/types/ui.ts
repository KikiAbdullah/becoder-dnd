// UI types
export interface UIState {
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  showHostPanel: boolean;
}

export interface LoadingState {
  isJoining: boolean;
  isVoting: boolean;
  isRolling: boolean;
  isTransitioning: boolean;
  isReconnecting: boolean;
}
