import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { AuditEntity, AuditLogList } from '../../core/models/audit-log.model';

export const auditLogsEvents = eventGroup({
  source: 'Audit Logs',
  events: {
    // Initial / reset load (also re-fired after an entity filter change).
    load: type<void>(),
    loadSuccess: type<AuditLogList>(),
    loadFailed: type<string>(),

    // Free-text search (debounced in the store effect).
    search: type<string>(),

    // Entity chip selection; `null` clears the filter ("All").
    filterByEntity: type<AuditEntity | null>(),

    // Append the next page onto the existing feed.
    loadMore: type<void>(),
    loadMoreSuccess: type<AuditLogList>(),
    loadMoreFailed: type<string>(),
  },
});
