import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types/auth';

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'recruiter' as Role });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: Role; is_active?: boolean } }) =>
      authApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const registerMutation = useMutation({
    mutationFn: () => authApi.register(newUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowRegisterModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'recruiter' });
    },
  });

  if (currentUser?.role !== 'admin') {
    return <p className="text-gray-500">Access denied. Admin only.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings - User Management</h1>
        <Button onClick={() => setShowRegisterModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateMutation.mutate({ id: u.id, data: { role: e.target.value as Role } })
                      }
                      disabled={u.id === currentUser?.id}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.is_active ? 'green' : 'red'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {u.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: u.id,
                            data: { is_active: !u.is_active },
                          })
                        }
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register New User"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser((u) => ({ ...u, full_name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
            required
          />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as Role }))}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'recruiter', label: 'Recruiter' },
              { value: 'viewer', label: 'Viewer' },
            ]}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" isLoading={registerMutation.isPending}>Register</Button>
            <Button type="button" variant="secondary" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
