import { computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mapResponse } from '@ngrx/operators';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { debounceTime, exhaustMap, from, switchMap, tap } from 'rxjs';
import {
  AuditDiffRow,
  AuditEntity,
  AuditLog,
  AuditRecord,
  AuditTone,
  ListAuditLogsParams,
} from '../../core/models/audit-log.model';
import { AuditLogsService } from '../../core/services/audit-logs.service';
import { auditLogsEvents } from './audit-logs.events';

export type AuditLogsFilter = {
  q: string;
  entity: AuditEntity | null;
};

/** A single audit event, shaped for the template (camelCase + formatted time). */
export interface AuditEntryView {
  id: string;
  icon: string;
  iconTone: AuditTone;
  chipTone: AuditTone;
  categoryLabel: string;
  actor: string;
  action: string;
  records: AuditRecord[];
  time: string;
  meta: string[];
  note: string | null;
  diff: AuditDiffRow[];
}

/** Events sharing a calendar day, under a formatted heading. */
export interface AuditGroupView {
  label: string;
  entries: AuditEntryView[];
}

type AuditLogsState = {
  logs: AuditLog[];
  total: number;
  offset: number;
  filter: AuditLogsFilter;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 600;

const initialState: AuditLogsState = {
  logs: [],
  total: 0,
  offset: 0,
  filter: { q: '', entity: null },
  loading: false,
  loadingMore: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: AuditLogsFilter, offset: number): ListAuditLogsParams => ({
  limit: PAGE_SIZE,
  offset,
  entity: filter.entity ?? undefined,
  q: filter.q || undefined,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const groupLabel = (date: Date, today: number): string => {
  const day = startOfDay(date);
  const datePart = dateFormatter.format(date).toUpperCase();
  if (day === today) {
    return `TODAY · ${datePart}`;
  }
  if (day === today - DAY_MS) {
    return `YESTERDAY · ${datePart}`;
  }
  return datePart;
};

const toEntry = (log: AuditLog, date: Date): AuditEntryView => ({
  id: log.id,
  icon: log.icon,
  iconTone: log.icon_tone,
  chipTone: log.chip_tone,
  categoryLabel: log.entity_label,
  actor: log.actor,
  action: log.action,
  records: log.records,
  time: timeFormatter.format(date),
  meta: log.meta,
  note: log.note,
  diff: log.diff,
});

// Bucket the (newest-first) feed into per-day groups, preserving order.
const buildGroups = (logs: AuditLog[]): AuditGroupView[] => {
  const today = startOfDay(new Date());
  const groups = new Map<number, AuditGroupView>();
  for (const log of logs) {
    const date = new Date(log.created_at);
    const key = startOfDay(date);
    let group = groups.get(key);
    if (!group) {
      group = { label: groupLabel(date, today), entries: [] };
      groups.set(key, group);
    }
    group.entries.push(toEntry(log, date));
  }
  return [...groups.values()];
};

export const AuditLogsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    groups: computed(() => buildGroups(store.logs())),
    hasMore: computed(() => store.logs().length < store.total()),
    eventCount: computed(() => store.total()),
  })),
  withReducer(
    on(auditLogsEvents.load, () => ({ loading: true, error: null, offset: 0 })),
    on(auditLogsEvents.loadSuccess, ({ payload }) => ({
      logs: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(auditLogsEvents.loadFailed, ({ payload }) => ({
      logs: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(auditLogsEvents.search, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload },
      offset: 0,
      loading: true,
      error: null,
    })),
    on(auditLogsEvents.filterByEntity, ({ payload }, state) => ({
      filter: { ...state.filter, entity: payload },
      offset: 0,
      loading: true,
      error: null,
    })),
    on(auditLogsEvents.loadMore, (_, state) => ({
      offset: state.offset + PAGE_SIZE,
      loadingMore: true,
      error: null,
    })),
    on(auditLogsEvents.loadMoreSuccess, ({ payload }, state) => ({
      logs: [...state.logs, ...payload.items],
      total: payload.total,
      loadingMore: false,
      error: null,
    })),
    on(auditLogsEvents.loadMoreFailed, ({ payload }, state) => ({
      offset: Math.max(0, state.offset - PAGE_SIZE),
      loadingMore: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      auditLogsService = inject(AuditLogsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      // Fresh loads: initial mount and entity-chip changes reset to page 0.
      reload$: events.on(auditLogsEvents.load, auditLogsEvents.filterByEntity).pipe(
        switchMap(() =>
          from(auditLogsService.list(toListParams(store.filter(), 0))).pipe(
            mapResponse({
              next: (list) => auditLogsEvents.loadSuccess(list),
              error: (error: unknown) =>
                auditLogsEvents.loadFailed(errorMessage(error, 'Failed to load audit logs.')),
            }),
          ),
        ),
      ),
      search$: events.on(auditLogsEvents.search).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(auditLogsService.list(toListParams(store.filter(), 0))).pipe(
            mapResponse({
              next: (list) => auditLogsEvents.loadSuccess(list),
              error: (error: unknown) =>
                auditLogsEvents.loadFailed(errorMessage(error, 'Failed to search audit logs.')),
            }),
          ),
        ),
      ),
      loadMore$: events.on(auditLogsEvents.loadMore).pipe(
        exhaustMap(() =>
          from(auditLogsService.list(toListParams(store.filter(), store.offset()))).pipe(
            mapResponse({
              next: (list) => auditLogsEvents.loadMoreSuccess(list),
              error: (error: unknown) =>
                auditLogsEvents.loadMoreFailed(
                  errorMessage(error, 'Failed to load more audit logs.'),
                ),
            }),
          ),
        ),
      ),
      loadFailed$: events
        .on(auditLogsEvents.loadFailed, auditLogsEvents.loadMoreFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
