import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { User } from '../../types';
import { mockUsers, areas } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export const UsersManagement: React.FC = () => {
  const { updateUsers } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 'analyst',
    area: '',
    isActive: true,
  });

  // Load users from localStorage or use mock data
  useEffect(() => {
    const storedUsers = localStorage.getItem('systemUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(mockUsers);
      localStorage.setItem('systemUsers', JSON.stringify(mockUsers));
    }
  }, []);

  // Update localStorage whenever users change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('systemUsers', JSON.stringify(users));
      updateUsers(users);
    }
  }, [users, updateUsers]);

  const roleLabels = {
    admin: 'Administrador',
    area_manager: 'Responsable de Área',
    analyst: 'Analista',
    consultant: 'Consultor',
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.password) {
      const user: User = {
        id: `user-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role as User['role'],
        area: newUser.area || undefined,
        isActive: newUser.isActive || true,
        createdAt: new Date().toISOString(),
      };
      
      setUsers(prevUsers => [...prevUsers, user]);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'analyst',
        area: '',
        isActive: true,
      });
      setShowAddForm(false);
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      isActive: user.isActive,
    });
  };

  const handleSaveEdit = () => {
    if (editingUser && editForm.name && editForm.email) {
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === editingUser 
          ? { 
              ...user, 
              name: editForm.name!,
              email: editForm.email!,
              role: editForm.role as User['role'],
              area: editForm.area,
              isActive: editForm.isActive!,
            }
          : user
      ));
      setEditingUser(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nuevo Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="analyst">Analista</option>
                <option value="area_manager">Responsable de Área</option>
                <option value="consultant">Consultor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {(newUser.role === 'area_manager' || newUser.role === 'analyst') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
                <select
                  value={newUser.area}
                  onChange={(e) => setNewUser({ ...newUser, area: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar área</option>
                  {areas.slice(1, -1).map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Agregar Usuario
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Área</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Último Acceso</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const userArea = areas.find(a => a.id === user.area);
                  const isEditing = editingUser === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                              placeholder="Nombre"
                            />
                            <input
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                              placeholder="Email"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <select
                            value={editForm.role || user.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="analyst">Analista</option>
                            <option value="area_manager">Responsable de Área</option>
                            <option value="consultant">Consultor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {roleLabels[user.role]}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <select
                            value={editForm.area || user.area || ''}
                            onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Sin área</option>
                            {areas.slice(1, -1).map(area => (
                              <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                          </select>
                        ) : userArea ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: userArea.color }}
                            />
                            <span className="text-sm text-gray-700">{userArea.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <select
                            value={editForm.isActive ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={clsx(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            )}
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : 'Nunca'
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Guardar"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(user)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};