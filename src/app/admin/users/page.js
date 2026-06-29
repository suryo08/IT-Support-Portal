'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, UserCheck, UserX, Clock, Search, Trash2, LogOut, 
  CheckCircle, XCircle, Shield, ShieldCheck, ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UserManagement = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRoles, setPendingRoles] = useState({});

  // Redirect if not super_admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/auth/users');
      setUsers(data);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) {
      alert('Anda tidak dapat mengubah peran Anda sendiri.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin mengubah peran user ini menjadi ${newRole === 'super_admin' ? 'Super Admin' : 'Admin'}?`)) {
      await fetchUsers(); // Re-fetch to reset visual state
      return;
    }

    setActionLoading(true);
    try {
      await axios.put('/api/auth/users', {
        user_id: userId,
        role: newRole
      });
      await fetchUsers();
    } catch (error) {
      console.error('Role change error:', error);
      alert('Gagal mengubah peran user: ' + (error.response?.data?.detail || 'Unknown error'));
      await fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (userId, approved) => {
    const selectedRole = pendingRoles[userId] || 'admin';
    const action = approved ? 'menyetujui' : 'menolak/menonaktifkan';
    
    let confirmMsg = `Apakah Anda yakin ingin ${action} user ini?`;
    if (approved) {
      confirmMsg = `Apakah Anda yakin ingin menyetujui user ini sebagai ${selectedRole === 'super_admin' ? 'Super Admin' : 'Admin'}?`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post('/api/auth/approve', {
        user_id: userId,
        approved,
        role: approved ? selectedRole : undefined
      });
      await fetchUsers();
    } catch (error) {
      console.error('Status change error:', error);
      alert('Gagal mengubah status user: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (userId === user.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus user dengan email ${email}? Tindakan ini permanen.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.delete(`/api/auth/users?id=${userId}`);
      await fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Gagal menghapus user: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePendingRoleSelect = (userId, role) => {
    setPendingRoles(prev => ({
      ...prev,
      [userId]: role
    }));
  };

  // Filter users based on search query
  const getFilteredList = (list) => {
    return list.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  const stats = {
    total: users.length,
    pending: pendingUsers.length,
    approved: approvedUsers.length,
    rejected: rejectedUsers.length
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-white border-0 flex items-center gap-1 w-fit">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white border-0 flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Pending
          </Badge>
        );
    }
  };

  const renderRoleBadge = (role) => {
    if (role === 'super_admin') {
      return (
        <Badge className="bg-purple-100 text-purple-750 border-purple-200 hover:bg-purple-100 flex items-center gap-1 w-fit font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center gap-1 w-fit font-semibold">
        <Shield className="w-3.5 h-3.5 text-slate-500" />
        Admin
      </Badge>
    );
  };

  // If not super_admin, show nothing while redirecting
  if (user && user.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src="/logo.png" 
                alt="Chitra Paratama" 
                className="h-10 object-contain cursor-pointer"
                style={{ maxWidth: '180px' }}
              />
            </Link>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Admin Dashboard
            </h1>
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-6">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium">
                  Tutorials
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="bg-white text-slate-900 shadow-sm hover:bg-white font-semibold">
                  User Management
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {user?.email}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title and description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Manajemen Pengguna & RBAC
          </h2>
          <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Kelola persetujuan pendaftaran, tentukan peran (Admin / Super Admin), dan atur hak akses pengguna.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pengguna</p>
                <p className="text-3xl font-bold text-slate-950 mt-2">{loading ? '...' : stats.total}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 rounded-full p-3.5">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menunggu Persetujuan</p>
                <p className="text-3xl font-bold text-slate-950 mt-2">{loading ? '...' : stats.pending}</p>
              </div>
              <div className="bg-amber-50 text-amber-600 rounded-full p-3.5">
                <Clock className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Disetujui</p>
                <p className="text-3xl font-bold text-slate-950 mt-2">{loading ? '...' : stats.approved}</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 rounded-full p-3.5">
                <UserCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendaftaran Ditolak</p>
                <p className="text-3xl font-bold text-slate-950 mt-2">{loading ? '...' : stats.rejected}</p>
              </div>
              <div className="bg-rose-50 text-rose-600 rounded-full p-3.5">
                <UserX className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs layout */}
        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="pending" className="w-full">
            <div className="px-6 pt-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
              <TabsList className="bg-slate-100 p-1 w-full md:w-auto self-start">
                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium text-sm flex items-center gap-2">
                  Persetujuan Pending
                  {pendingUsers.length > 0 && (
                    <span className="bg-amber-500 text-white rounded-full text-xs px-2 py-0.5 font-bold">
                      {pendingUsers.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium text-sm">
                  Aktif / Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium text-sm">
                  Ditolak / Rejected
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium text-sm">
                  Semua
                </TabsTrigger>
              </TabsList>

              {/* Search input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {/* PENDING USERS TAB */}
            <TabsContent value="pending" className="m-0 focus-visible:outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Nama / Email</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Tanggal Daftar</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase w-48">Pilih Peran (RBAC)</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Status</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Loading data pengguna...
                        </TableCell>
                      </TableRow>
                    ) : getFilteredList(pendingUsers).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Tidak ada permintaan persetujuan pending yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredList(pendingUsers).map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(u.created_at)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Select 
                              value={pendingRoles[u.id] || 'admin'} 
                              onValueChange={(val) => handlePendingRoleSelect(u.id, val)}
                            >
                              <SelectTrigger className="h-8 border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {renderStatusBadge(u.status)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleStatusChange(u.id, true)}
                                disabled={actionLoading}
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1 border-0"
                              >
                                Setujui
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(u.id, false)}
                                disabled={actionLoading}
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                              >
                                Tolak
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* APPROVED USERS TAB */}
            <TabsContent value="approved" className="m-0 focus-visible:outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Nama / Email</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Tanggal Disetujui</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase w-48">Peran / Role</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Status</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Loading data pengguna...
                        </TableCell>
                      </TableRow>
                    ) : getFilteredList(approvedUsers).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Tidak ada admin aktif yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredList(approvedUsers).map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {u.name} {u.id === user?.id && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-normal ml-2">Anda</span>}
                            </div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(u.approved_at || u.created_at)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {u.id === user?.id ? (
                              renderRoleBadge(u.role)
                            ) : (
                              <Select 
                                value={u.role} 
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                                disabled={actionLoading}
                              >
                                <SelectTrigger className="h-8 border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {renderStatusBadge(u.status)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.id !== user?.id && (
                                <>
                                  <Button
                                    onClick={() => handleStatusChange(u.id, false)}
                                    disabled={actionLoading}
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-200 text-slate-750 hover:bg-slate-50 font-semibold"
                                  >
                                    Tolak / Suspend
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    disabled={actionLoading}
                                    size="sm"
                                    variant="destructive"
                                    className="bg-rose-500 hover:bg-rose-600 font-semibold"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Hapus
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* REJECTED USERS TAB */}
            <TabsContent value="rejected" className="m-0 focus-visible:outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Nama / Email</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Tanggal Ditindak</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase w-48">Peran / Role</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Status</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Loading data pengguna...
                        </TableCell>
                      </TableRow>
                    ) : getFilteredList(rejectedUsers).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Tidak ada pendaftaran ditolak yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredList(rejectedUsers).map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(u.approved_at || u.created_at)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {renderRoleBadge(u.role)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {renderStatusBadge(u.status)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleStatusChange(u.id, true)}
                                disabled={actionLoading}
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1 border-0"
                              >
                                Pulihkan / Approve
                              </Button>
                              <Button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={actionLoading}
                                size="sm"
                                variant="destructive"
                                className="bg-rose-500 hover:bg-rose-600 font-semibold"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Hapus
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ALL USERS TAB */}
            <TabsContent value="all" className="m-0 focus-visible:outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Nama / Email</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase w-48">Peran / Role</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Status</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase">Tgl Registrasi</TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Loading data pengguna...
                        </TableCell>
                      </TableRow>
                    ) : getFilteredList(users).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          Tidak ada pengguna ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredList(users).map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {u.name} {u.id === user?.id && <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-normal ml-2">Anda</span>}
                            </div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {u.id === user?.id || u.status !== 'approved' ? (
                              renderRoleBadge(u.role)
                            ) : (
                              <Select 
                                value={u.role} 
                                onValueChange={(val) => handleRoleChange(u.id, val)}
                                disabled={actionLoading}
                              >
                                <SelectTrigger className="h-8 border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {renderStatusBadge(u.status)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 text-sm">
                            {formatDate(u.created_at)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.id !== user?.id && (
                                <>
                                  {u.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleStatusChange(u.id, true)}
                                        disabled={actionLoading}
                                        size="sm"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold border-0"
                                      >
                                        Setujui
                                      </Button>
                                      <Button
                                        onClick={() => handleStatusChange(u.id, false)}
                                        disabled={actionLoading}
                                        size="sm"
                                        variant="outline"
                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                                      >
                                        Tolak
                                      </Button>
                                    </>
                                  )}
                                  {u.status === 'approved' && (
                                    <Button
                                      onClick={() => handleStatusChange(u.id, false)}
                                      disabled={actionLoading}
                                      size="sm"
                                      variant="outline"
                                      className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                    >
                                      Tolak / Suspend
                                    </Button>
                                  )}
                                  {u.status === 'rejected' && (
                                    <Button
                                      onClick={() => handleStatusChange(u.id, true)}
                                      disabled={actionLoading}
                                      size="sm"
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold border-0"
                                    >
                                      Setujui / Pulihkan
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    disabled={actionLoading}
                                    size="sm"
                                    variant="destructive"
                                    className="bg-rose-500 hover:bg-rose-600 font-semibold"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Hapus
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  return (
    <ProtectedRoute>
      <UserManagement />
    </ProtectedRoute>
  );
};

export default UserManagementPage;
