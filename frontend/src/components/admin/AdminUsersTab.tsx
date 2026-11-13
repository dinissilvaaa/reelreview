// ============================================================================
// components/admin/AdminUsersTab.tsx
// Admin panel tab: list users, promote/demote admins, delete accounts.
// ============================================================================

import { useEffect, useState } from 'react'; // React hooks
import { deleteUser, fetchUsers, updateUserRole } from '../../api/userApi'; // User API
import { getErrorMessage } from '../../api/client'; // Error -> text
import { useAuth } from '../../hooks/useAuth'; // Current admin (to protect their own row)
import { Spinner } from '../Spinner'; // Loading indicator
import { Alert } from '../Alert'; // Message box
import { formatDate } from '../../utils/format'; // Date formatting
import type { AdminUser } from '../../types'; // Type

export function AdminUsersTab() {
  const { user: me } = useAuth(); // The logged-in admin
  const [reloadCount, setReloadCount] = useState(0); // Increment to reload the list
  const [state, setState] = useState<{ key: number; users: AdminUser[]; error: string }>({ key: -1, users: [], error: '' }); // List data
  const [busyId, setBusyId] = useState(''); // Row with a request in progress
  const [notice, setNotice] = useState(''); // Success message
  const [actionError, setActionError] = useState(''); // Action error

  const loading = state.key !== reloadCount; // Waiting for the current request?

  // Load the users (again) whenever reloadCount changes
  useEffect(() => {
    let ignore = false; // Ignore late responses
    fetchUsers() // GET /api/users
      .then((users) => {
        if (!ignore) setState({ key: reloadCount, users, error: '' }); // Success
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ key: reloadCount, users: [], error: getErrorMessage(error) }); // Failure
      });
    return () => {
      ignore = true; // Cleanup
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1); // Trigger the effect again

  // Promote to admin / demote to user
  const handleRoleToggle = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'; // Opposite role
    setBusyId(user.id); // Disable this row's buttons
    setActionError(''); // Clear old errors
    try {
      await updateUserRole(user.id, newRole); // PATCH /api/users/:id/role
      setNotice(`${user.username} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`); // Feedback
      reload(); // Refresh
    } catch (error) {
      setActionError(getErrorMessage(error)); // Show the problem
    } finally {
      setBusyId(''); // Re-enable the buttons
    }
  };

  // Delete an account (after confirmation)
  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.username} and all of their reviews? This cannot be undone.`)) return; // Ask first
    setBusyId(user.id); // Disable this row's buttons
    setActionError(''); // Clear old errors
    try {
      await deleteUser(user.id); // DELETE /api/users/:id
      setNotice(`${user.username} was deleted.`); // Feedback
      reload(); // Refresh
    } catch (error) {
      setActionError(getErrorMessage(error)); // Show the problem
    } finally {
      setBusyId(''); // Re-enable the buttons
    }
  };

  if (loading && state.key === -1) return <Spinner label="Loading users..." />; // First load only

  return (
    <div className="space-y-5">
      {/* Messages */}
      {state.error && <Alert type="error">{state.error}</Alert>}
      {notice && (
        <Alert type="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert type="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      {/* Users table (scrolls sideways on small screens) */}
      <div className={`overflow-x-auto rounded-xl border border-slate-800 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-900 text-xs text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Reviews</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {state.users.map((user) => {
              const isMe = user.id === me?.id; // My own row?
              const busy = busyId === user.id; // Request in progress for this row?
              return (
                <tr key={user.id} className="hover:bg-slate-900/60">
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">
                      {user.username} {isMe && <span className="text-xs font-normal text-slate-500">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  {/* Role badge */}
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${user.role === 'admin' ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                      {user.role}
                    </span>
                  </td>
                  {/* Review count */}
                  <td className="px-4 py-3 text-slate-300">{user.reviewCount}</td>
                  {/* Registration date */}
                  <td className="px-4 py-3 text-slate-400">{formatDate(user.createdAt)}</td>
                  {/* Actions (disabled for my own account) */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-secondary px-3 py-1" disabled={isMe || busy} onClick={() => void handleRoleToggle(user)}>
                        {user.role === 'admin' ? 'Make user' : 'Make admin'}
                      </button>
                      <button type="button" className="btn btn-danger px-3 py-1" disabled={isMe || busy} onClick={() => void handleDelete(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
