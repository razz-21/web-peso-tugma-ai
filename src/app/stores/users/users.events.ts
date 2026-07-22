import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { UserGet, UserList, UserPost } from '../../core/models/user.model';
import { UsersFilter } from './users.store';

export const usersEvents = eventGroup({
  source: 'Users',
  events: {
    loadUser: type<UsersFilter>(),
    loadUserSuccess: type<UserList>(),
    loadUserFailed: type<string>(),

    searchUser: type<string>(),
    searchUserSuccess: type<UserList>(),
    searchUserFailed: type<string>(),

    deleteUser: type<string>(),
    deleteUserSuccess: type<string>(),
    deleteUserFailed: type<string>(),

    createUser: type<UserPost>(),
    createUserSuccess: type<UserGet>(),
    createUserFailed: type<string>(),

    inviteUsers: type<{ userIds: string[]; workspaceId: string }>(),
    inviteUsersSuccess: type<UserGet[]>(),
    inviteUsersFailed: type<string>(),

    removeMember: type<string>(),
    removeMemberSuccess: type<string>(),
    removeMemberFailed: type<string>(),
  },
});
