import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { UserGet, UserPatch } from '../../core/models/user.model';
import { UpdateUserPayload } from './user-details.store';

export const userDetailsEvents = eventGroup({
  source: 'User Details',
  events: {
    loadUserDetails: type<{ id: string }>(),
    loadUserDetailsSuccess: type<UserGet>(),
    loadUserDetailsFailed: type<string>(),

    updateUser: type<{ id: string; user: UserPatch; message: string }>(),
    updateUserSuccess: type<{ id: string; user: UserGet; message: string }>(),
    updateUserFailed: type<string>(),
  },
});

export type UpdateUserResult = { user: UserGet; message: string };
