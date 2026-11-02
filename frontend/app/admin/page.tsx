'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { inviteAPI, userAPI, moderationAPI } from '@/lib/api';
import { format } from 'date-fns';
import type { InviteCode, UserListItem, ReportItem } from '@/lib/types';

type ApiErrorShape = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeApiError = error as ApiErrorShape;
    const message = maybeApiError.response?.data?.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useStore();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'invites' | 'users' | 'reports'>('reports');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (user) {
      loadAll();
    }
  }, [router, user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadInviteCodes(), loadUsers(), loadReports()]);
    setLoading(false);
  };

  const loadInviteCodes = async () => {
    try {
      const data = await inviteAPI.getAll();
      setInviteCodes(data.inviteCodes);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load invite codes'));
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data.users);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load users'));
    }
  };

  const loadReports = async () => {
    try {
      const data = await moderationAPI.adminGetReports();
      setReports(data.reports || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load reports'));
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const data = await inviteAPI.create(expiresInHours, maxUses);
      setSuccess(`Created code: ${data.code}`);
      setExpiresInHours(1);
      setMaxUses(1);
      await loadInviteCodes();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create invite code'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm(`Delete invite code ${code}?`)) return;

    try {
      await inviteAPI.delete(code);
      setSuccess(`Deleted code: ${code}`);
      await loadInviteCodes();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete code'));
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user ${username}? This action cannot be undone.`)) return;

    try {
      await userAPI.delete(userId);
      setSuccess(`Deleted user: ${username}`);
      await loadUsers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete user'));
    }
  };

  const handleUpdateUserStatus = async (publicId: number, newStatus: 'active' | 'suspended' | 'banned') => {
    if (!confirm(`Set user #${publicId} status to "${newStatus.toUpperCase()}"?`)) return;

    try {
      await moderationAPI.adminUpdateUserStatus(publicId, newStatus);
      setSuccess(`Updated #${publicId} status to ${newStatus}`);
      await Promise.all([loadUsers(), loadReports()]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update user status'));
    }
  };

  const handleUpdateReport = async (reportId: string, status: 'reviewed' | 'dismissed', actionTaken?: string) => {
    try {
      await moderationAPI.adminUpdateReport(reportId, status, actionTaken);
      setSuccess(`Report marked as ${status}`);
      await loadReports();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update report'));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Copied: ${text}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const getCardBg = (idx: number, isAvailable: boolean) => {
    if (!isAvailable) return 'bg-surface';
    const bgs = ['bg-card', 'bg-muted', 'bg-green-100', 'bg-purple-100'];
    return bgs[idx % 4];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-2xl font-black">LOADING...</div>
      </div>
    );
  }

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="gradient-purple px-6 py-4 border-y-[3px] border-black">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">ADMIN PANEL</h1>
            <p className="text-xs font-bold mt-1 text-white opacity-70">
              Manage moderation reports, user bans, and invite codes
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="badge-brutal bg-cyan text-white">ADMIN</span>
            <button onClick={() => router.push('/')} className="btn-brutal bg-yellow text-dark px-5 py-2">
              BACK TO CHAT
            </button>
            <button onClick={logout} className="btn-brutal bg-error text-white px-5 py-2">
              LOGOUT
            </button>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => router.push('/')} className="btn-brutal bg-yellow text-dark h-9 px-3 text-xs">
              BACK
            </button>
            <button onClick={logout} className="btn-brutal bg-error text-white h-9 px-3 text-xs">
              OUT
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-muted p-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="card-brutal bg-error text-white p-4 mb-4 flex justify-between items-center">
              <p className="font-bold text-sm">{error}</p>
              <button onClick={() => setError('')} className="font-black text-xs">✕</button>
            </div>
          )}

          {success && (
            <div className="card-brutal bg-success text-white p-4 mb-4 flex justify-between items-center">
              <p className="font-bold text-sm">{success}</p>
              <button onClick={() => setSuccess('')} className="font-black text-xs">✕</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setActiveTab('reports')}
              className={`btn-brutal px-4 py-2 text-sm flex items-center gap-2 ${
                activeTab === 'reports' ? 'bg-purple text-white' : 'bg-card text-dark'
              }`}
            >
              <span>REPORTS</span>
              {pendingReportsCount > 0 && (
                <span className="badge-brutal bg-error text-white text-xs px-1 py-0">
                  {pendingReportsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn-brutal px-4 py-2 text-sm ${
                activeTab === 'users' ? 'bg-purple text-white' : 'bg-card text-dark'
              }`}
            >
              USERS ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`btn-brutal px-4 py-2 text-sm ${
                activeTab === 'invites' ? 'bg-purple text-white' : 'bg-card text-dark'
              }`}
            >
              INVITE CODES ({inviteCodes.length})
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="card-brutal bg-card p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-black text-purple">
                    MODERATION REPORTS ({reports.length})
                  </h2>
                  <button onClick={loadReports} className="btn-brutal bg-yellow text-xs px-3 py-1">
                    REFRESH
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-bold text-sm text-dim">
                      No reports in the queue. Everything is clean!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reports.map((report) => {
                      const reportedPubId = report.reportedUserId?.publicId;
                      const userStatus = report.reportedUserId?.status || 'active';

                      return (
                        <div
                          key={report._id}
                          className={`card-brutal p-4 ${
                            report.status === 'pending'
                              ? 'bg-yellow-50 border-orange-500'
                              : report.status === 'reviewed'
                              ? 'bg-green-50'
                              : 'bg-surface opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-error">
                                  REPORTED: #{reportedPubId || 'N/A'} ({report.reportedUserId?.username || 'Unknown'})
                                </span>
                                <span
                                  className={`badge-brutal text-xs text-white ${
                                    userStatus === 'banned'
                                      ? 'bg-error'
                                      : userStatus === 'suspended'
                                      ? 'bg-warning'
                                      : 'bg-success'
                                  }`}
                                >
                                  {userStatus.toUpperCase()}
                                </span>
                                <span
                                  className={`badge-brutal text-xs ${
                                    report.status === 'pending'
                                      ? 'bg-orange-500 text-white'
                                      : report.status === 'reviewed'
                                      ? 'bg-purple text-white'
                                      : 'bg-surface text-dim'
                                  }`}
                                >
                                  {report.status.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-xs text-dim mt-1">
                                Reported by: <strong>#{report.reporterId?.publicId || 'N/A'} ({report.reporterId?.username})</strong>
                                {' • '}
                                {format(new Date(report.createdAt), 'MMM dd, HH:mm')}
                              </p>

                              <div className="mt-2 p-2 bg-surface border border-black rounded text-xs font-bold">
                                Reason: <span className="font-normal">{report.reason}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 self-end sm:self-center">
                              {reportedPubId && userStatus !== 'banned' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(reportedPubId, 'banned')}
                                  className="btn-brutal bg-error text-white text-xs px-3 py-1.5"
                                >
                                  BAN USER
                                </button>
                              )}
                              {reportedPubId && userStatus === 'banned' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(reportedPubId, 'active')}
                                  className="btn-brutal bg-success text-white text-xs px-3 py-1.5"
                                >
                                  UNBAN
                                </button>
                              )}
                              {report.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateReport(report._id, 'reviewed', 'Acknowledged by admin')}
                                    className="btn-brutal bg-purple text-white text-xs px-3 py-1.5"
                                  >
                                    RESOLVE
                                  </button>
                                  <button
                                    onClick={() => handleUpdateReport(report._id, 'dismissed', 'Dismissed as non-violating')}
                                    className="btn-brutal bg-surface text-dark text-xs px-3 py-1.5"
                                  >
                                    DISMISS
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="card-brutal bg-card p-4">
                <h2 className="text-sm font-black text-purple mb-4">USERS ({users.length})</h2>

                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-bold text-sm text-dim">No users found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {users.map((userItem, idx) => {
                      const isCurrentUser = userItem.username === user?.username;
                      const canManage = !isCurrentUser && userItem.role !== 'admin';
                      const bgColors = ['bg-card', 'bg-muted', 'bg-green-100', 'bg-purple-100'];
                      const currentStatus = userItem.status || 'active';

                      return (
                        <div key={userItem._id} className={`card-brutal p-4 ${bgColors[idx % 4]}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs bg-black text-yellow px-1 py-0.5">
                                #{userItem.publicId || '????'}
                              </span>
                              <span className="font-black text-sm">{userItem.username}</span>
                              <span
                                className={`badge-brutal text-xs text-white ${
                                  userItem.role === 'admin' ? 'bg-purple' : 'bg-cyan'
                                }`}
                              >
                                {userItem.role.toUpperCase()}
                              </span>
                              <span
                                className={`badge-brutal text-xs text-white ${
                                  currentStatus === 'banned'
                                    ? 'bg-error'
                                    : currentStatus === 'suspended'
                                    ? 'bg-warning'
                                    : 'bg-success'
                                }`}
                              >
                                {currentStatus.toUpperCase()}
                              </span>
                              {isCurrentUser && (
                                <span className="badge-brutal text-xs bg-yellow text-dark">
                                  YOU
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {canManage && userItem.publicId && (
                                <>
                                  {currentStatus === 'active' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateUserStatus(userItem.publicId!, 'suspended')}
                                        className="btn-brutal bg-warning text-white text-xs py-1 px-2.5"
                                      >
                                        SUSPEND
                                      </button>
                                      <button
                                        onClick={() => handleUpdateUserStatus(userItem.publicId!, 'banned')}
                                        className="btn-brutal bg-error text-white text-xs py-1 px-2.5"
                                      >
                                        BAN
                                      </button>
                                    </>
                                  )}
                                  {currentStatus !== 'active' && (
                                    <button
                                      onClick={() => handleUpdateUserStatus(userItem.publicId!, 'active')}
                                      className="btn-brutal bg-success text-white text-xs py-1 px-2.5"
                                    >
                                      REACTIVATE
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(userItem._id, userItem.username)}
                                    className="btn-brutal bg-surface text-error text-xs py-1 px-2.5"
                                  >
                                    DELETE
                                  </button>
                                </>
                              )}
                              {!canManage && !isCurrentUser && (
                                <span className="text-xs text-dim font-bold">PROTECTED</span>
                              )}
                            </div>
                          </div>
                          {userItem.createdAt && (
                            <div className="text-xs text-dim mt-2">
                              <span>
                                Joined: <strong>{format(new Date(userItem.createdAt), 'MMM dd, yyyy')}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* INVITE CODES TAB */}
            {activeTab === 'invites' && (
              <>
                <div className="card-brutal bg-card p-4">
                  <h2 className="text-sm font-black text-cyan mb-4">CREATE INVITE CODE</h2>
                  <form onSubmit={handleCreateCode}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold mb-2">EXPIRES IN (HOURS)</label>
                        <input
                          type="number"
                          value={expiresInHours}
                          onChange={(e) => setExpiresInHours(Number(e.target.value))}
                          className="input-brutal w-full"
                          min={1}
                          max={168}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2">MAX USES</label>
                        <input
                          type="number"
                          value={maxUses}
                          onChange={(e) => setMaxUses(Number(e.target.value))}
                          className="input-brutal w-full"
                          min={1}
                          max={100}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={creating} className="btn-brutal w-full bg-success text-white py-3">
                      {creating ? 'CREATING...' : 'CREATE CODE'}
                    </button>
                  </form>
                </div>

                <div className="card-brutal bg-card p-4">
                  <h2 className="text-sm font-black text-purple mb-4">
                    INVITE CODES ({inviteCodes.length})
                  </h2>

                  {inviteCodes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="font-bold text-sm text-dim">
                        No invite codes yet. Create one above.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {inviteCodes.map((code, idx) => (
                        <div
                          key={code.code}
                          className={`card-brutal p-4 ${getCardBg(idx, code.isAvailable)} ${
                            !code.isAvailable ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code
                                  className="font-black font-mono cursor-pointer hover:underline text-sm"
                                  onClick={() => copyToClipboard(code.code)}
                                  title="Click to copy"
                                >
                                  {code.code}
                                </code>
                                <span
                                  className={`badge-brutal text-xs text-white ${
                                    code.isAvailable
                                      ? 'bg-success'
                                      : code.isExpired
                                      ? 'bg-warning'
                                      : 'bg-error'
                                  }`}
                                >
                                  {code.isAvailable ? 'ACTIVE' : code.isExpired ? 'EXPIRED' : 'USED UP'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteCode(code.code)}
                                className="btn-brutal bg-error text-white text-xs py-1.5 px-3"
                              >
                                DELETE
                              </button>
                            </div>
                            <div className="text-xs text-dim flex flex-col gap-1">
                              <span>
                                Uses: <strong>{code.currentUses}/{code.maxUses}</strong>
                              </span>
                              <span>
                                Expires: <strong>{format(new Date(code.expiresAt), 'MMM dd, HH:mm')}</strong>
                              </span>
                              <span>
                                By: <strong>{code.createdByUsername}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
