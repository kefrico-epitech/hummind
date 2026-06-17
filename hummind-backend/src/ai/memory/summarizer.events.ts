export const HUMMIND_TURN_COMPLETED_EVENT = 'hummind.turn.completed';

export interface HummindTurnCompletedPayload {
  userId: string;
  courseId: string;
  turnsTotal: number;
}
