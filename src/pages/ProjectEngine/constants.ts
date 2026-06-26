// 交付物状态颜色映射
import type { DeliverableStatus } from '../../types';

export const STATUS_COLORS: Record<DeliverableStatus, string> = {
  pending: 'default',
  draft: 'processing',
  ai_generating: 'purple',
  reviewing: 'warning',
  approved: 'success',
  revision_needed: 'error',
};
