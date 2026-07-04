import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { MePatch, UserGet } from '../../core/models/user.model';

export const meEvents = eventGroup({
  source: 'Me',
  events: {
    loadMe: type<void>(),
    loadMeSuccess: type<UserGet>(),
    loadMeFailed: type<string>(),

    resetMe: type<void>(),

    updateMe: type<{ data: MePatch; message: string }>(),
    updateMeSuccess: type<{ user: UserGet; message: string }>(),
    updateMeFailed: type<string>(),
  },
});
