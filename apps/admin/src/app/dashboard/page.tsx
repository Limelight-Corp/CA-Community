'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AscendLogoMark,
  ExportIcon,
  PlusIcon,
  SearchIcon,
  CheckIcon,
  Modal,
} from '@ascend/ui';
import {
  useCommunityData,
  ContentType,
} from '../../lib/useCommunityData';

type AdminTab =
  | 'overview'
  | 'events'
  | 'gallery'
  | 'speakers'
  | 'wings'
  | 'news'
  | 'resources'
  | 'payments'
  | 'members';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    data,
    addItem,
    updateItem,
    deleteItem,
    togglePublish,
  } = useCommunityData(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: ContentType; item: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: ContentType; item: any } | null>(null);

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Static overview data
  const payments = [
    { booking: 'ASC27-LAU-0613', attendee: 'CA Kavya Reddy', event: 'Launch Summit', status: 'Paid', amount: 1179 },
    { booking: 'ASC27-GST-0221', attendee: 'CA Ritu Sinha', event: 'GST Clinic', status: 'Pending', amount: 589 },
    { booking: 'ASC27-SPE-0118', attendee: 'Rahul Nair', event: 'Speed Networking', status: 'Paid', amount: 235 },
    { booking: 'ASC27-CFO-0087', attendee: 'CA Meera Iyer', event: 'Inside the CFO Office', status: 'Failed', amount: 943 },
    { booking: 'ASC27-TAX-0530', attendee: 'CA Vikram Rao', event: 'Budget 2027 Decoded', status: 'Refunded', amount: 471 },
  ];

  const members = [
    { name: 'CA Kavya Reddy', plan: 'Core', city: 'Hyderabad', joined: '03 Nov' },
    { name: 'CA Aman Joshi', plan: 'Core', city: 'Indore', joined: '04 Nov' },
    { name: 'Adv. Nikhil Sethi', plan: 'Associate', city: 'New Delhi', joined: '05 Nov' },
    { name: 'Rahul Nair', plan: 'Student', city: 'Bengaluru', joined: '06 Nov' },
  ];

  const weeklyBars = [180, 260, 310, 420, 388, 512];

  const pillClass = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'p-ok';
      case 'Pending':
        return 'p-warn';
      case 'Failed':
        return 'p-bad';
      case 'Refunded':
      default:
        return 'p-mute';
    }
  };

  // Reset page when tab or filters change
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setMobileMenuOpen(false);
  };

  // Filter current entity items
  const currentList = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'events') list = data.events || [];
    else if (activeTab === 'gallery') list = data.gallery || [];
    else if (activeTab === 'speakers') list = data.speakers || [];
    else if (activeTab === 'wings') list = data.wings || [];
    else if (activeTab === 'news') list = data.news || [];
    else if (activeTab === 'resources') list = data.resources || [];
    else return [];

    return list.filter((item) => {
      // Status filter
      if (statusFilter === 'published' && item.isPublished === false) return false;
      if (statusFilter === 'draft' && item.isPublished !== false) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = (item.title || item.name || '').toLowerCase().includes(q);
      const descMatch = (item.description || item.bio || item.summary || item.tags || '').toLowerCase().includes(q);
      const cityMatch = (item.city || item.location || '').toLowerCase().includes(q);
      const catMatch = (item.category || '').toLowerCase().includes(q);
      return titleMatch || descMatch || cityMatch || catMatch;
    });
  }, [activeTab, data, statusFilter, searchQuery]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, currentPage, pageSize]);

  // Actions
  const handleTogglePublish = async (type: ContentType, id: string, title: string) => {
    const newStatus = await togglePublish(type, id);
    showToast(`"${title}" is now ${newStatus ? 'Published to Web & Mobile' : 'Draft (Hidden from Public)'}`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const { type, item } = deletingItem;
    const title = item.title || item.name || 'Item';
    await deleteItem(type, item.id);
    setDeletingItem(null);
    showToast(`Deleted "${title}" successfully`);
    if (currentPage > 1 && paginatedList.length === 1) {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'speakers', label: 'Speakers', icon: '🎤' },
    { id: 'wings', label: 'Wings', icon: '🏛️' },
    { id: 'news', label: 'News & Dispatches', icon: '📰' },
    { id: 'resources', label: 'Resources', icon: '📚' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'members', label: 'Members', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] bg-[#0C1A58] text-[#DBE7F0] border border-[#2F6FE4] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckIcon size={18} className="text-[#6F95FF]" />
          <span className="text-[13.5px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <header className="hdr border-b border-[var(--line)] bg-[rgba(3,5,15,0.85)] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="logo-mark flex items-center justify-center p-1.5 rounded-lg bg-[rgba(47,91,255,0.15)] text-[var(--accent)]">
              <AscendLogoMark size={20} />
            </span>
            <div className="flex items-center gap-2">
              <b className="font-display tracking-tight text-lg">ASCEND</b>
              <span className="pill p-mute text-[10.5px] py-0.5 px-2">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:inline mono text-xs text-[var(--muted)]">
              admin@ascend-ca.in
            </span>
            <button
              onClick={() => router.push('/theme')}
              className="btn btn-line btn-sm text-xs py-1.5 px-3"
            >
              Theme Studio
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn btn-ghost btn-sm text-xs py-1.5 px-3"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Header with Hamburger Toggle & Horizontal Strip */}
        <div className="md:hidden border-t border-[var(--line)] px-3 py-2 flex items-center justify-between bg-[rgba(10,14,35,0.7)]">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 mr-2 scrollbar-none">
            {navigationTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as AdminTab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--muted)] hover:text-white border border-[var(--line)]'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 px-2.5 rounded-lg border border-[var(--line)] text-xs text-[var(--fg)] flex items-center justify-center flex-shrink-0 bg-[rgba(255,255,255,0.04)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Dropdown Menu if toggled */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--line)] p-3 bg-[var(--card)] flex flex-col gap-1 shadow-2xl">
            {navigationTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as AdminTab)}
                className={`w-full text-left py-2.5 px-3 rounded-lg text-sm flex items-center justify-between ${
                  activeTab === t.id
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[rgba(255,255,255,0.03)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </div>
                {activeTab === t.id && <span className="text-xs">Active</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Admin Section: EXACT 20% SIDEBAR & 80% CONTENT ON DESKTOP */}
      <main className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 md:px-8 py-5 md:py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* SIDEBAR: EXACT 20% ON DESKTOP (1 OF 5 COLUMNS) */}
          <aside className="hidden md:block md:col-span-1 md:sticky md:top-24">
            <div className="p-3 md:p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
              <div className="mb-3 px-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Navigation
                </span>
              </div>
              <nav className="flex flex-col gap-1">
                {navigationTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as AdminTab)}
                      className={`w-full flex items-center justify-between text-left py-2.5 px-3 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-[var(--accent)] text-white font-medium shadow-md'
                          : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-[var(--line)] text-xs text-[var(--muted)] px-2">
                <div className="flex justify-between items-center py-1">
                  <span>Version</span>
                  <span className="mono">v2.4.0</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Sync Status</span>
                  <span className="text-emerald-400 font-medium">● Real-time</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA: EXACT 80% ON DESKTOP (4 OF 5 COLUMNS) */}
          <section className="w-full md:col-span-4 min-w-0 flex flex-col gap-5 sm:gap-6">
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-4 sm:p-5 rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
              <div>
                <span className="eyebrow text-xs">Admin Management</span>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight mt-1 capitalize text-[var(--fg)]">
                  {activeTab === 'overview'
                    ? 'Platform Overview'
                    : activeTab === 'news'
                    ? 'News & Dispatches'
                    : `${activeTab} Management`}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                  Manage records, publish live updates to web and mobile views, and upload media.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  className="btn btn-line btn-sm text-xs py-2 px-3.5"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ascend-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    showToast('Exported community data backup');
                  }}
                >
                  <ExportIcon size={14} /> Export Backup
                </button>

                {['events', 'gallery', 'speakers', 'wings', 'news', 'resources'].includes(activeTab) && (
                  <button
                    className="btn btn-dark btn-sm text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <PlusIcon size={15} />
                    Add {activeTab.slice(0, -1)}
                  </button>
                )}
              </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                    <span className="text-xs text-[var(--muted)]">Total Events</span>
                    <b className="block text-3xl font-display font-medium mt-1 text-[var(--fg)]">
                      {data.events?.length || 0}
                    </b>
                    <em className="text-xs text-emerald-400 not-italic block mt-1">
                      {data.events?.filter((e) => e.isPublished !== false).length || 0} Published
                    </em>
                  </div>
                  <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                    <span className="text-xs text-[var(--muted)]">Gallery Items</span>
                    <b className="block text-3xl font-display font-medium mt-1 text-[var(--fg)]">
                      {data.gallery?.length || 0}
                    </b>
                    <em className="text-xs text-emerald-400 not-italic block mt-1">
                      {data.gallery?.filter((g) => g.isPublished !== false).length || 0} Published
                    </em>
                  </div>
                  <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                    <span className="text-xs text-[var(--muted)]">Speakers</span>
                    <b className="block text-3xl font-display font-medium mt-1 text-[var(--fg)]">
                      {data.speakers?.length || 0}
                    </b>
                    <em className="text-xs text-[var(--muted)] not-italic block mt-1">
                      Across 10 wings
                    </em>
                  </div>
                  <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                    <span className="text-xs text-[var(--muted)]">Resources</span>
                    <b className="block text-3xl font-display font-medium mt-1 text-[var(--fg)]">
                      {data.resources?.length || 0}
                    </b>
                    <em className="text-xs text-emerald-400 not-italic block mt-1">
                      {data.resources?.filter((r) => r.isPublished !== false).length || 0} Published
                    </em>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="eyebrow text-xs">Activity Trends</span>
                    <span className="text-xs mono text-[var(--muted)]">Past 6 Weeks</span>
                  </div>
                  <div className="bars flex items-end gap-3 h-32">
                    {weeklyBars.map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <i
                          className="w-full rounded-t transition-all bg-gradient-to-t from-[#0F38C0] to-[#6F95FF]"
                          style={{ height: `${(v / 512) * 100}%` }}
                        />
                        <span className="text-[10px] mono text-[var(--muted)]">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium">Recent Registrations & Payments</h3>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-xs mono text-[var(--muted)]">
                          <th className="pb-3">Booking</th>
                          <th className="pb-3">Attendee</th>
                          <th className="pb-3">Event</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {payments.map((p) => (
                          <tr key={p.booking} className="hover:bg-[rgba(255,255,255,0.015)]">
                            <td className="py-3 mono text-xs">{p.booking}</td>
                            <td className="py-3 font-medium">{p.attendee}</td>
                            <td className="py-3 text-[var(--muted)] text-xs">{p.event}</td>
                            <td className="py-3">
                              <span className={`pill ${pillClass(p.status)} text-xs`}>{p.status}</span>
                            </td>
                            <td className="py-3 text-right mono">₹{p.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CRUD TABS (Events, Gallery, Speakers, Wings, News, Resources) */}
            {['events', 'gallery', 'speakers', 'wings', 'news', 'resources'].includes(activeTab) && (
              <div className="flex flex-col gap-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--card)]">
                  <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                    />
                    <input
                      type="text"
                      className="inp w-full pl-9 py-2 text-sm"
                      placeholder={`Search ${activeTab} by title, city, category...`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[var(--muted)] mono">Filter:</span>
                    {(['all', 'published', 'draft'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          statusFilter === st
                            ? 'bg-[var(--accent)] text-white border-transparent shadow-sm'
                            : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-white'
                        }`}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EVENTS SPECIFIC UI FIX: DESKTOP TABLE & MOBILE CARDS */}
                {activeTab === 'events' ? (
                  <div className="flex flex-col gap-4">
                    {/* Desktop View: Polished Table with fixed width and smooth scrolling */}
                    <div className="hidden md:block rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[840px]">
                          <thead>
                            <tr className="border-b border-[var(--line)] bg-[rgba(255,255,255,0.02)] text-xs mono text-[var(--muted)]">
                              <th className="py-3 px-4">Event Details</th>
                              <th className="py-3 px-4">Wing / Category</th>
                              <th className="py-3 px-4">Date & Time</th>
                              <th className="py-3 px-4">Mode / Venue</th>
                              <th className="py-3 px-4">Fee</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            {paginatedList.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                                  No events found matching your filter criteria.
                                </td>
                              </tr>
                            ) : (
                              paginatedList.map((item: any) => {
                                const isPub = item.isPublished !== false;
                                return (
                                  <tr key={item.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    <td className="py-3.5 px-4">
                                      <div className="flex items-center gap-3">
                                        {item.imageUrl ? (
                                          <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-10 h-10 rounded-lg object-cover border border-[var(--line)] flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-[rgba(47,91,255,0.15)] border border-[rgba(47,91,255,0.3)] flex items-center justify-center text-sm font-semibold text-[#9DB6FF] flex-shrink-0">
                                            #{item.wingNumber}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <div className="font-medium text-[var(--fg)] truncate max-w-[240px]">
                                            {item.title}
                                          </div>
                                          <div className="text-xs text-[var(--muted)] mono">slug: {item.slug}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className="pill p-mute text-xs">Wing #{item.wingNumber}</span>
                                      <div className="text-xs text-[var(--muted)] mt-1">{item.category}</div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="mono text-xs font-medium">{item.date}</div>
                                      <div className="text-xs text-[var(--muted)] mt-0.5">{item.time}</div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className={`pill ${item.mode === 'Online' ? 'p-ok' : 'p-mute'} text-xs`}>
                                        {item.mode}
                                      </span>
                                      <div className="text-xs text-[var(--muted)] mt-1 truncate max-w-[160px]">
                                        {item.city} · {item.venue}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 mono text-xs font-semibold">
                                      {item.fee === 0 ? 'Free' : `₹${item.fee}`}
                                      {item.memberFee < item.fee && (
                                        <div className="text-[11px] text-[var(--muted)] font-normal">
                                          Mem: ₹{item.memberFee}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePublish('events', item.id, item.title)}
                                        className={`pill cursor-pointer text-xs transition-transform hover:scale-105 ${
                                          isPub ? 'p-ok' : 'p-warn'
                                        }`}
                                      >
                                        {isPub ? '● Published' : '○ Draft'}
                                      </button>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePublish('events', item.id, item.title)}
                                          className="btn btn-ghost btn-sm px-2.5 py-1 text-xs"
                                        >
                                          {isPub ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItem({ type: 'events', item })}
                                          className="btn btn-line btn-sm px-2.5 py-1 text-xs"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingItem({ type: 'events', item })}
                                          className="btn btn-ghost btn-sm px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile View: Dedicated Responsive Event Cards */}
                    <div className="md:hidden flex flex-col gap-3">
                      {paginatedList.length === 0 ? (
                        <div className="p-8 text-center text-[var(--muted)] rounded-xl border border-[var(--line)] bg-[var(--card)]">
                          No events found.
                        </div>
                      ) : (
                        paginatedList.map((item: any) => {
                          const isPub = item.isPublished !== false;
                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] flex flex-col gap-3 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-12 h-12 rounded-lg object-cover border border-[var(--line)] flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[rgba(47,91,255,0.15)] border border-[rgba(47,91,255,0.3)] flex items-center justify-center text-sm font-semibold text-[#9DB6FF] flex-shrink-0">
                                      #{item.wingNumber}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-sm leading-snug">{item.title}</h4>
                                    <div className="text-xs text-[var(--muted)] mt-0.5">
                                      Wing #{item.wingNumber} · {item.category}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish('events', item.id, item.title)}
                                  className={`pill text-[11px] py-0.5 px-2.5 ${isPub ? 'p-ok' : 'p-warn'}`}
                                >
                                  {isPub ? 'Published' : 'Draft'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">
                                <div>
                                  <span className="block text-[11px] mono">Date & Time:</span>
                                  <span className="text-[var(--fg)] font-medium">{item.date} ({item.time})</span>
                                </div>
                                <div>
                                  <span className="block text-[11px] mono">Venue / Mode:</span>
                                  <span className="text-[var(--fg)] font-medium truncate block">
                                    {item.city} ({item.mode})
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[11px] mono">Ticket Fee:</span>
                                  <span className="text-[var(--fg)] font-medium">
                                    {item.fee === 0 ? 'Free' : `₹${item.fee}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[11px] mono">Seats:</span>
                                  <span className="text-[var(--fg)] font-medium">
                                    {item.seatsTaken} / {item.seatsTotal}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish('events', item.id, item.title)}
                                  className="btn btn-ghost btn-sm text-xs py-1 px-3 flex-1"
                                >
                                  {isPub ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem({ type: 'events', item })}
                                  className="btn btn-line btn-sm text-xs py-1 px-3 flex-1"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem({ type: 'events', item })}
                                  className="btn btn-ghost btn-sm text-xs py-1 px-3 text-red-400 hover:border-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* OTHER ENTITIES (Gallery, Speakers, Wings, News, Resources) */
                  <div className="flex flex-col gap-4">
                    {/* Desktop View: Wide Polished Table */}
                    <div className="hidden md:block rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                          <thead>
                            <tr className="border-b border-[var(--line)] bg-[rgba(255,255,255,0.02)] text-xs mono text-[var(--muted)]">
                              {activeTab === 'gallery' && (
                                <>
                                  <th className="py-3 px-4">Item Details</th>
                                  <th className="py-3 px-4">Category</th>
                                  <th className="py-3 px-4">Date & Location</th>
                                  <th className="py-3 px-4">Media / Gradient</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </>
                              )}
                              {activeTab === 'speakers' && (
                                <>
                                  <th className="py-3 px-4">Speaker</th>
                                  <th className="py-3 px-4">Title / Role</th>
                                  <th className="py-3 px-4">Expertise</th>
                                  <th className="py-3 px-4">Slug</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </>
                              )}
                              {activeTab === 'wings' && (
                                <>
                                  <th className="py-3 px-4">#</th>
                                  <th className="py-3 px-4">Name</th>
                                  <th className="py-3 px-4">Tags</th>
                                  <th className="py-3 px-4">Activities</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </>
                              )}
                              {activeTab === 'news' && (
                                <>
                                  <th className="py-3 px-4">Article</th>
                                  <th className="py-3 px-4">Category</th>
                                  <th className="py-3 px-4">Date</th>
                                  <th className="py-3 px-4">Summary</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </>
                              )}
                              {activeTab === 'resources' && (
                                <>
                                  <th className="py-3 px-4">Resource</th>
                                  <th className="py-3 px-4">Category</th>
                                  <th className="py-3 px-4">Format</th>
                                  <th className="py-3 px-4">Access</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            {paginatedList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-12 text-[var(--muted)]">
                                  No {activeTab} found.
                                </td>
                              </tr>
                            ) : (
                              paginatedList.map((item: any) => {
                                const isPub = item.isPublished !== false;
                                const itemTitle = item.title || item.name;

                                return (
                                  <tr key={item.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    {/* GALLERY ROW */}
                                    {activeTab === 'gallery' && (
                                      <>
                                        <td className="py-3.5 px-4 font-medium">
                                          <div className="flex items-center gap-3">
                                            {item.imageUrl ? (
                                              <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-10 h-8 rounded object-cover border border-[var(--line)] flex-shrink-0"
                                              />
                                            ) : (
                                              <div
                                                className={`w-10 h-8 rounded border border-[var(--line)] bg-gradient-to-r ${item.accentGradient || 'from-blue-900 to-indigo-900'} flex-shrink-0`}
                                              />
                                            )}
                                            <span className="truncate max-w-[220px]">{item.title}</span>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="pill p-mute text-xs">{item.category}</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <div className="text-xs font-medium">{item.date}</div>
                                          <div className="text-xs text-[var(--muted)]">{item.location}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="text-xs mono text-[var(--muted)] truncate max-w-[140px] block">
                                            {item.imageUrl ? 'Uploaded Photo' : item.accentGradient}
                                          </span>
                                        </td>
                                      </>
                                    )}

                                    {/* SPEAKERS ROW */}
                                    {activeTab === 'speakers' && (
                                      <>
                                        <td className="py-3.5 px-4">
                                          <div className="flex items-center gap-3">
                                            {item.avatarUrl ? (
                                              <img
                                                src={item.avatarUrl}
                                                alt={item.name}
                                                className="w-9 h-9 rounded-full object-cover border border-[var(--line)] flex-shrink-0"
                                              />
                                            ) : (
                                              <div className="w-9 h-9 rounded-full bg-[rgba(47,91,255,0.2)] border border-[rgba(47,91,255,0.4)] flex items-center justify-center font-medium text-xs text-[#9DB6FF] flex-shrink-0">
                                                {item.name.charAt(0)}
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <div className="font-medium text-sm">{item.name}</div>
                                              <div className="text-xs text-[var(--muted)] truncate max-w-[200px]">
                                                {item.bio}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--muted)]">{item.title}</td>
                                        <td className="py-3.5 px-4">
                                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                                            {(item.expertise || []).slice(0, 2).map((exp: string, idx: number) => (
                                              <span key={idx} className="pill p-mute text-[10px]">
                                                {exp}
                                              </span>
                                            ))}
                                            {(item.expertise?.length || 0) > 2 && (
                                              <span className="text-[11px] text-[var(--muted)]">
                                                +{item.expertise.length - 2}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 mono text-xs">{item.slug}</td>
                                      </>
                                    )}

                                    {/* WINGS ROW */}
                                    {activeTab === 'wings' && (
                                      <>
                                        <td className="py-3.5 px-4 mono font-bold">#{item.number}</td>
                                        <td className="py-3.5 px-4">
                                          <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                                            <b className="text-sm">{item.name}</b>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--muted)] max-w-[200px] truncate">
                                          {item.tags}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs mono text-[var(--muted)]">
                                          {item.activities?.length || 0} activities
                                        </td>
                                      </>
                                    )}

                                    {/* NEWS ROW */}
                                    {activeTab === 'news' && (
                                      <>
                                        <td className="py-3.5 px-4">
                                          <div className="flex items-center gap-3">
                                            {item.coverImageUrl && (
                                              <img
                                                src={item.coverImageUrl}
                                                alt={item.title}
                                                className="w-10 h-7 rounded object-cover border border-[var(--line)] flex-shrink-0"
                                              />
                                            )}
                                            <div>
                                              <div className="font-medium text-sm truncate max-w-[220px]">
                                                {item.title}
                                              </div>
                                              <div className="text-xs text-[var(--muted)] mono">slug: {item.slug}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="pill p-mute text-xs">{item.category}</span>
                                        </td>
                                        <td className="py-3.5 px-4 mono text-xs">{item.date}</td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--muted)] max-w-[220px] truncate">
                                          {item.summary}
                                        </td>
                                      </>
                                    )}

                                    {/* RESOURCES ROW */}
                                    {activeTab === 'resources' && (
                                      <>
                                        <td className="py-3.5 px-4 font-medium">
                                          <div className="truncate max-w-[240px]">{item.title}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <span className="pill p-mute text-xs">{item.category}</span>
                                        </td>
                                        <td className="py-3.5 px-4 mono text-xs">{item.format}</td>
                                        <td className="py-3.5 px-4">
                                          <span className={`pill ${item.isMembersOnly ? 'p-warn' : 'p-ok'} text-xs`}>
                                            {item.isMembersOnly ? 'Members Only' : 'Open'}
                                          </span>
                                        </td>
                                      </>
                                    )}

                                    {/* STATUS COLUMN */}
                                    <td className="py-3.5 px-4">
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePublish(activeTab as ContentType, item.id, itemTitle)}
                                        className={`pill cursor-pointer text-xs transition-transform hover:scale-105 ${
                                          isPub ? 'p-ok' : 'p-warn'
                                        }`}
                                      >
                                        {isPub ? '● Published' : '○ Draft'}
                                      </button>
                                    </td>

                                    {/* ACTIONS COLUMN */}
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePublish(activeTab as ContentType, item.id, itemTitle)}
                                          className="btn btn-ghost btn-sm px-2.5 py-1 text-xs"
                                        >
                                          {isPub ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItem({ type: activeTab as ContentType, item })}
                                          className="btn btn-line btn-sm px-2.5 py-1 text-xs"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingItem({ type: activeTab as ContentType, item })}
                                          className="btn btn-ghost btn-sm px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:border-red-500"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile View: Dedicated Responsive Cards for other entities */}
                    <div className="md:hidden flex flex-col gap-3">
                      {paginatedList.length === 0 ? (
                        <div className="p-8 text-center text-[var(--muted)] rounded-xl border border-[var(--line)] bg-[var(--card)]">
                          No {activeTab} found.
                        </div>
                      ) : (
                        paginatedList.map((item: any) => {
                          const isPub = item.isPublished !== false;
                          const itemTitle = item.title || item.name;

                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] flex flex-col gap-3 shadow-sm"
                            >
                              {/* GALLERY MOBILE CARD */}
                              {activeTab === 'gallery' && (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {item.imageUrl ? (
                                        <img
                                          src={item.imageUrl}
                                          alt={item.title}
                                          className="w-14 h-12 rounded-lg object-cover border border-[var(--line)] flex-shrink-0"
                                        />
                                      ) : (
                                        <div
                                          className={`w-14 h-12 rounded-lg border border-[var(--line)] bg-gradient-to-r ${item.accentGradient || 'from-blue-900 to-indigo-900'} flex-shrink-0`}
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</h4>
                                        <div className="text-xs text-[var(--muted)] mt-0.5">
                                          {item.category} · {item.date}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish('gallery', item.id, itemTitle)}
                                      className={`pill text-[11px] py-0.5 px-2.5 flex-shrink-0 ${isPub ? 'p-ok' : 'p-warn'}`}
                                    >
                                      {isPub ? 'Published' : 'Draft'}
                                    </button>
                                  </div>
                                  <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)] flex justify-between">
                                    <span>Location: <strong className="text-[var(--fg)] font-medium">{item.location}</strong></span>
                                    <span>{item.imageUrl ? 'Uploaded Photo' : 'Theme Gradient'}</span>
                                  </div>
                                </>
                              )}

                              {/* SPEAKERS MOBILE CARD */}
                              {activeTab === 'speakers' && (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {item.avatarUrl ? (
                                        <img
                                          src={item.avatarUrl}
                                          alt={item.name}
                                          className="w-12 h-12 rounded-full object-cover border border-[var(--line)] flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-full bg-[rgba(47,91,255,0.2)] border border-[rgba(47,91,255,0.4)] flex items-center justify-center font-bold text-sm text-[#9DB6FF] flex-shrink-0">
                                          {item.name.charAt(0)}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-sm leading-snug">{item.name}</h4>
                                        <div className="text-xs text-[var(--muted)] mt-0.5">{item.title}</div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish('speakers', item.id, itemTitle)}
                                      className={`pill text-[11px] py-0.5 px-2.5 flex-shrink-0 ${isPub ? 'p-ok' : 'p-warn'}`}
                                    >
                                      {isPub ? 'Published' : 'Draft'}
                                    </button>
                                  </div>
                                  {item.bio && (
                                    <p className="text-xs text-[var(--muted)] line-clamp-2 pt-2 border-t border-[var(--line)]">
                                      {item.bio}
                                    </p>
                                  )}
                                  {item.expertise && item.expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {item.expertise.map((exp: string, idx: number) => (
                                        <span key={idx} className="pill p-mute text-[10px] py-0.5 px-2">
                                          {exp}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}

                              {/* WINGS MOBILE CARD */}
                              {activeTab === 'wings' && (
                                <>
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                      <div>
                                        <h4 className="font-semibold text-sm">Wing #{item.number}: {item.name}</h4>
                                        <div className="text-xs text-[var(--muted)]">{item.tags}</div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish('wings', item.id, itemTitle)}
                                      className={`pill text-[11px] py-0.5 px-2.5 flex-shrink-0 ${isPub ? 'p-ok' : 'p-warn'}`}
                                    >
                                      {isPub ? 'Published' : 'Draft'}
                                    </button>
                                  </div>
                                  <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">
                                    Activities: <span className="text-[var(--fg)]">{Array.isArray(item.activities) ? item.activities.join(', ') : item.activities}</span>
                                  </div>
                                </>
                              )}

                              {/* NEWS MOBILE CARD */}
                              {activeTab === 'news' && (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {item.coverImageUrl && (
                                        <img
                                          src={item.coverImageUrl}
                                          alt={item.title}
                                          className="w-14 h-11 rounded-lg object-cover border border-[var(--line)] flex-shrink-0"
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</h4>
                                        <div className="text-xs text-[var(--muted)] mt-0.5">
                                          {item.category} · {item.date}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish('news', item.id, itemTitle)}
                                      className={`pill text-[11px] py-0.5 px-2.5 flex-shrink-0 ${isPub ? 'p-ok' : 'p-warn'}`}
                                    >
                                      {isPub ? 'Published' : 'Draft'}
                                    </button>
                                  </div>
                                  {item.summary && (
                                    <p className="text-xs text-[var(--muted)] line-clamp-2 pt-2 border-t border-[var(--line)]">
                                      {item.summary}
                                    </p>
                                  )}
                                </>
                              )}

                              {/* RESOURCES MOBILE CARD */}
                              {activeTab === 'resources' && (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {item.fileUrl ? (
                                        <img
                                          src={item.fileUrl}
                                          alt={item.title}
                                          className="w-12 h-14 rounded-lg object-cover border border-[var(--line)] flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-12 h-14 rounded-lg bg-[rgba(47,91,255,0.15)] border border-[var(--line)] flex items-center justify-center text-lg flex-shrink-0">
                                          📄
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</h4>
                                        <div className="text-xs text-[var(--muted)] mt-1 flex flex-wrap gap-1.5 items-center">
                                          <span className="pill p-mute text-[10px]">{item.category}</span>
                                          <span className="mono text-[11px]">{item.format}</span>
                                          <span className={`pill ${item.isMembersOnly ? 'p-warn' : 'p-ok'} text-[10px]`}>
                                            {item.isMembersOnly ? 'Members' : 'Open'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublish('resources', item.id, itemTitle)}
                                      className={`pill text-[11px] py-0.5 px-2.5 flex-shrink-0 ${isPub ? 'p-ok' : 'p-warn'}`}
                                    >
                                      {isPub ? 'Published' : 'Draft'}
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* COMMON ACTION BUTTONS ON MOBILE CARD */}
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(activeTab as ContentType, item.id, itemTitle)}
                                  className="btn btn-ghost btn-sm text-xs py-1.5 px-3 flex-1"
                                >
                                  {isPub ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem({ type: activeTab as ContentType, item })}
                                  className="btn btn-line btn-sm text-xs py-1.5 px-3 flex-1"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem({ type: activeTab as ContentType, item })}
                                  className="btn btn-ghost btn-sm text-xs py-1.5 px-3 text-red-400 hover:border-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* PAGINATION CONTROLS */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] text-xs text-[var(--muted)] shadow-sm">
                  <div className="flex items-center gap-3">
                    <span>
                      Showing {currentList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, currentList.length)} of {currentList.length} items
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <span>Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-transparent border border-[var(--line)] rounded px-1.5 py-0.5 text-[var(--fg)] text-xs"
                      >
                        <option value={5} className="bg-[#0C1A58]">5</option>
                        <option value={10} className="bg-[#0C1A58]">10</option>
                        <option value={20} className="bg-[#0C1A58]">20</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="btn btn-line btn-sm py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      &larr; Prev
                    </button>
                    <span className="mono px-2 text-xs">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="btn btn-line btn-sm py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
              <div className="flex flex-col gap-4">
                {/* Desktop Table */}
                <div className="hidden md:block p-5 rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-xs mono text-[var(--muted)]">
                          <th className="pb-3 px-2">Booking Code</th>
                          <th className="pb-3 px-2">Attendee</th>
                          <th className="pb-3 px-2">Event</th>
                          <th className="pb-3 px-2">Status</th>
                          <th className="pb-3 px-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {payments.map((p) => (
                          <tr key={p.booking} className="hover:bg-[rgba(255,255,255,0.015)]">
                            <td className="py-3 px-2 mono text-xs">{p.booking}</td>
                            <td className="py-3 px-2 font-medium">{p.attendee}</td>
                            <td className="py-3 px-2 text-[var(--muted)] text-xs">{p.event}</td>
                            <td className="py-3 px-2">
                              <span className={`pill ${pillClass(p.status)} text-xs`}>{p.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right mono">₹{p.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {payments.map((p) => (
                    <div key={p.booking} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="mono text-xs text-[var(--muted)]">{p.booking}</span>
                        <span className={`pill ${pillClass(p.status)} text-[11px]`}>{p.status}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{p.attendee}</h4>
                          <span className="text-xs text-[var(--muted)]">{p.event}</span>
                        </div>
                        <span className="mono text-sm font-semibold text-[var(--fg)]">₹{p.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="flex flex-col gap-4">
                {/* Desktop Table */}
                <div className="hidden md:block p-5 rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-xs mono text-[var(--muted)]">
                          <th className="pb-3 px-2">Member Name</th>
                          <th className="pb-3 px-2">Plan</th>
                          <th className="pb-3 px-2">City</th>
                          <th className="pb-3 px-2">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {members.map((m, idx) => (
                          <tr key={idx} className="hover:bg-[rgba(255,255,255,0.015)]">
                            <td className="py-3 px-2 font-medium">{m.name}</td>
                            <td className="py-3 px-2 mono text-xs">
                              <span className="pill p-ok text-xs">{m.plan}</span>
                            </td>
                            <td className="py-3 px-2 text-[var(--muted)] text-xs">{m.city}</td>
                            <td className="py-3 px-2 text-[var(--muted)] text-xs">{m.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {members.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] flex items-center justify-between shadow-sm">
                      <div>
                        <h4 className="font-semibold text-sm">{m.name}</h4>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{m.city} · Joined {m.joined}</div>
                      </div>
                      <span className="pill p-ok text-xs">{m.plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ADD ITEM MODAL - FIX CLIPPING WITH SCROLLABLE INTERNAL CONTAINER */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${activeTab.slice(0, -1)}`}
        description={`Fill out details and upload images below. Choose "Published" to push immediately to live web/mobile views.`}
        maxWidth="lg"
      >
        <ItemForm
          type={activeTab as ContentType}
          onSave={async (newItem) => {
            await addItem(activeTab as ContentType, newItem);
            setIsAddModalOpen(false);
            showToast(`Added new ${activeTab.slice(0, -1)}: "${newItem.title || newItem.name}"`);
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* EDIT ITEM MODAL - FIX CLIPPING */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Edit ${editingItem?.type.slice(0, -1)}`}
        description={`Update fields or replace images. Changes synchronize automatically.`}
        maxWidth="lg"
      >
        {editingItem && (
          <ItemForm
            type={editingItem.type}
            initialValues={editingItem.item}
            isEditing
            onSave={async (updates) => {
              await updateItem(editingItem.type, editingItem.item.id, updates);
              setEditingItem(null);
              showToast(`Updated "${updates.title || updates.name}" successfully`);
            }}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--fg)]">
                &ldquo;{deletingItem.item.title || deletingItem.item.name}&rdquo;
              </strong>
              ?
            </p>
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-300 leading-normal">
              Warning: This item will be removed permanently from the admin records and will disappear immediately from public web and mobile views.
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="btn btn-line btn-sm text-xs py-2 px-3.5"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-medium text-xs py-2 px-4 shadow-lg"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// REUSABLE LOCAL IMAGE UPLOAD COMPONENT
// ------------------------------------------------------------------------------------------------
interface ImageUploaderProps {
  label: string;
  currentUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  aspect?: 'square' | 'video' | 'banner';
}

function ImageUploader({
  label,
  currentUrl,
  onImageUploaded,
  onImageRemoved,
  aspect = 'banner',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant local preview
    const localDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || '');
      reader.readAsDataURL(file);
    });
    setPreviewUrl(localDataUrl);

    // 2. Upload to local server /api/upload
    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error(`Upload HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.url) {
        setPreviewUrl(json.url);
        onImageUploaded(json.url);
        return;
      }
      throw new Error(json.error || 'Upload failed');
    } catch (err) {
      console.warn('Local file upload API error, saving data URL as fallback:', err);
      onImageUploaded(localDataUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onImageRemoved();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClass =
    aspect === 'square'
      ? 'w-24 h-24 rounded-full'
      : aspect === 'video'
      ? 'w-full h-36 rounded-lg'
      : 'w-full h-28 rounded-lg';

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-xs font-medium text-[var(--muted)]">{label}</label>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group border border-[var(--line)] rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
          <img
            src={previewUrl}
            alt="Upload preview"
            className={`${aspectClass} object-cover mx-auto`}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-line btn-sm text-xs py-1 px-2.5 bg-black/70 text-white"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-ghost btn-sm text-xs py-1 px-2.5 bg-red-950/80 text-red-300 border-red-700 hover:bg-red-900"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 text-xs text-[var(--muted)] hover:text-white transition-colors bg-[rgba(255,255,255,0.01)]"
        >
          <span className="text-xl">📷</span>
          <span className="font-medium">
            {isUploading ? 'Uploading to local storage...' : 'Click to Upload Local Image'}
          </span>
          <span className="text-[11px] text-[var(--muted)]">PNG, JPG, WEBP (Max 5MB)</span>
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// UNIVERSAL FORM COMPONENT - MODAL CLIPPING FIXED WITH SCROLLABLE INTERNAL CONTAINER
// ------------------------------------------------------------------------------------------------
interface ItemFormProps {
  type: ContentType;
  initialValues?: any;
  isEditing?: boolean;
  onSave: (values: any) => Promise<void>;
  onCancel: () => void;
}

function ItemForm({ type, initialValues, isEditing, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState<any>(() => {
    if (initialValues) return { ...initialValues };

    if (type === 'events') {
      return {
        title: '',
        slug: '',
        wingNumber: 1,
        category: 'Conference',
        date: new Date().toISOString().slice(0, 10),
        time: '10:00 AM',
        venue: '',
        city: 'New Delhi',
        mode: 'Offline',
        fee: 0,
        memberFee: 0,
        seatsTotal: 100,
        seatsTaken: 0,
        speakerSlugs: [],
        description: '',
        imageUrl: '',
        isPublished: true,
      };
    }
    if (type === 'gallery') {
      return {
        title: '',
        category: 'Conferences',
        date: 'January 2027',
        location: '',
        accentGradient: 'from-[#0C1A58] via-[#10298A] to-[#04081E]',
        imageUrl: '',
        isPublished: true,
      };
    }
    if (type === 'speakers') {
      return {
        name: '',
        slug: '',
        title: '',
        bio: '',
        expertise: 'Direct Tax, Audit',
        avatarUrl: '',
        isPublished: true,
      };
    }
    if (type === 'wings') {
      return {
        number: 1,
        name: '',
        color: '#2F6FE4',
        tags: '',
        activities: 'Monthly Update, Annual Summit',
        isPublished: true,
      };
    }
    if (type === 'news') {
      return {
        title: '',
        slug: '',
        category: 'Announcement',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        summary: '',
        content: '',
        coverImageUrl: '',
        isPublished: true,
      };
    }
    if (type === 'resources') {
      return {
        title: '',
        category: 'Tax updates',
        format: 'PDF · 12 pages',
        isMembersOnly: false,
        downloads: 0,
        fileUrl: '',
        isPublished: true,
      };
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validation
    if (type === 'events' && (!formData.title || !formData.date || !formData.venue)) {
      setValidationError('Title, Date and Venue are required.');
      return;
    }
    if (type === 'gallery' && (!formData.title || !formData.location)) {
      setValidationError('Title and Location are required.');
      return;
    }
    if (type === 'speakers' && (!formData.name || !formData.title)) {
      setValidationError('Speaker Name and Title are required.');
      return;
    }
    if (type === 'wings' && (!formData.name || !formData.number)) {
      setValidationError('Wing Number and Name are required.');
      return;
    }
    if (type === 'news' && (!formData.title || !formData.summary)) {
      setValidationError('News Title and Summary are required.');
      return;
    }
    if (type === 'resources' && (!formData.title || !formData.format)) {
      setValidationError('Resource Title and Format are required.');
      return;
    }

    const payload = { ...formData };
    if (!payload.slug && payload.title) {
      payload.slug = payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (type === 'speakers' && !payload.slug && payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (type === 'speakers' && typeof payload.expertise === 'string') {
      payload.expertise = payload.expertise.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'wings' && typeof payload.activities === 'string') {
      payload.activities = payload.activities.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    try {
      setIsSubmitting(true);
      await onSave(payload);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm pb-2">
      {validationError && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-lg text-xs">
          {validationError}
        </div>
      )}

      {/* EVENTS FORM */}
      {type === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Event Title *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Budget 2027 Decoded"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="Event Banner Image (Local Upload)"
              currentUrl={formData.imageUrl}
              onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
              onImageRemoved={() => setFormData({ ...formData, imageUrl: '' })}
              aspect="banner"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Wing Number</label>
            <select
              className="inp w-full"
              value={formData.wingNumber || 1}
              onChange={(e) => setFormData({ ...formData, wingNumber: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n} className="bg-[#0C1A58]">
                  Wing #{n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Category</label>
            <select
              className="inp w-full"
              value={formData.category || 'Conference'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {['Conference', 'Workshop', 'Seminar', 'Networking', 'Training', 'Career'].map((c) => (
                <option key={c} value={c} className="bg-[#0C1A58]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Date (YYYY-MM-DD) *</label>
            <input
              type="date"
              required
              className="inp w-full"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Time *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.time || ''}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="e.g. 10:00 AM"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Mode</label>
            <select
              className="inp w-full"
              value={formData.mode || 'Offline'}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            >
              <option value="Offline" className="bg-[#0C1A58]">Offline</option>
              <option value="Online" className="bg-[#0C1A58]">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">City *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. New Delhi, Mumbai, Bengaluru"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Venue *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.venue || ''}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. Bharat Mandapam, New Delhi"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">General Fee (₹)</label>
            <input
              type="number"
              min="0"
              className="inp w-full"
              value={formData.fee ?? 0}
              onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Member Fee (₹)</label>
            <input
              type="number"
              min="0"
              className="inp w-full"
              value={formData.memberFee ?? 0}
              onChange={(e) => setFormData({ ...formData, memberFee: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Total Seats</label>
            <input
              type="number"
              min="1"
              className="inp w-full"
              value={formData.seatsTotal || 100}
              onChange={(e) => setFormData({ ...formData, seatsTotal: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">URL Slug (Optional)</label>
            <input
              type="text"
              className="inp w-full"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Description</label>
            <textarea
              rows={3}
              className="inp w-full"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the session..."
            />
          </div>
        </div>
      )}

      {/* GALLERY FORM */}
      {type === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Gallery Title *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. National Tax Summit Opening Plenary"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="Gallery Image (Local Upload)"
              currentUrl={formData.imageUrl}
              onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
              onImageRemoved={() => setFormData({ ...formData, imageUrl: '' })}
              aspect="banner"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Category</label>
            <select
              className="inp w-full"
              value={formData.category || 'Conferences'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {['Conferences', 'Masterclasses', 'Sports', 'Social'].map((c) => (
                <option key={c} value={c} className="bg-[#0C1A58]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Date Display</label>
            <input
              type="text"
              className="inp w-full"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="e.g. January 2027"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Location *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Bharat Mandapam, New Delhi"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Fallback Gradient Theme</label>
            <select
              className="inp w-full mb-1"
              value={formData.accentGradient || 'from-[#0C1A58] via-[#10298A] to-[#04081E]'}
              onChange={(e) => setFormData({ ...formData, accentGradient: e.target.value })}
            >
              <option value="from-[#0C1A58] via-[#10298A] to-[#04081E]" className="bg-[#0C1A58]">Deep Navy / Blue</option>
              <option value="from-[#2B0E4D] via-[#481E7F] to-[#0D0517]" className="bg-[#0C1A58]">Royal Purple / Violet</option>
              <option value="from-[#0A3D36] via-[#12665C] to-[#031512]" className="bg-[#0C1A58]">Emerald Teal</option>
              <option value="from-[#14307A] via-[#1D49BB] to-[#081333]" className="bg-[#0C1A58]">Cobalt Azure</option>
              <option value="from-[#4D0D40] via-[#7B1968] to-[#140210]" className="bg-[#0C1A58]">Berry Magenta</option>
              <option value="from-[#502208] via-[#853C12] to-[#170902]" className="bg-[#0C1A58]">Amber Copper</option>
            </select>
          </div>
        </div>
      )}

      {/* SPEAKERS FORM */}
      {type === 'speakers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Speaker Full Name *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. CA Rohan Mehta"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="Speaker Photo (Local Upload)"
              currentUrl={formData.avatarUrl}
              onImageUploaded={(url) => setFormData({ ...formData, avatarUrl: url })}
              onImageRemoved={() => setFormData({ ...formData, avatarUrl: '' })}
              aspect="square"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Designation & City *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Partner, International Tax · Mumbai"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Bio</label>
            <textarea
              rows={3}
              className="inp w-full"
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Short professional biography..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Expertise (comma separated)</label>
            <input
              type="text"
              className="inp w-full"
              value={Array.isArray(formData.expertise) ? formData.expertise.join(', ') : formData.expertise || ''}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              placeholder="e.g. International Tax, Transfer Pricing, Cross-border"
            />
          </div>
        </div>
      )}

      {/* WINGS FORM */}
      {type === 'wings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Wing Number (1-10+) *</label>
            <input
              type="number"
              required
              min="1"
              className="inp w-full"
              value={formData.number || 1}
              onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Wing Name *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tax & Regulatory"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Accent Color</label>
            <input
              type="text"
              className="inp w-full"
              value={formData.color || '#2F6FE4'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#2F6FE4"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Tags (sub-topics)</label>
            <input
              type="text"
              className="inp w-full"
              value={formData.tags || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Direct Tax · GST · Customs · International"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Activities (comma separated)</label>
            <input
              type="text"
              className="inp w-full"
              value={Array.isArray(formData.activities) ? formData.activities.join(', ') : formData.activities || ''}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              placeholder="Tax Update Live, Case Law Café, Annual Tax Summit"
            />
          </div>
        </div>
      )}

      {/* NEWS FORM */}
      {type === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">News Headline *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Founding member registrations open"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="Cover / Banner Image (Local Upload)"
              currentUrl={formData.coverImageUrl}
              onImageUploaded={(url) => setFormData({ ...formData, coverImageUrl: url })}
              onImageRemoved={() => setFormData({ ...formData, coverImageUrl: '' })}
              aspect="banner"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Category</label>
            <select
              className="inp w-full"
              value={formData.category || 'Announcement'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {['Announcement', 'Community', 'Chapters', 'Regulatory'].map((c) => (
                <option key={c} value={c} className="bg-[#0C1A58]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Date Display</label>
            <input
              type="text"
              className="inp w-full"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="03 Nov 2026"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Summary (1-2 sentences) *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary shown on cards..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Full Content</label>
            <textarea
              rows={4}
              className="inp w-full"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full dispatch article content..."
            />
          </div>
        </div>
      )}

      {/* RESOURCES FORM */}
      {type === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Resource Title *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Budget 2027: first-look summary"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              label="Resource Cover / Document Thumbnail (Local Upload)"
              currentUrl={formData.fileUrl}
              onImageUploaded={(url) => setFormData({ ...formData, fileUrl: url })}
              onImageRemoved={() => setFormData({ ...formData, fileUrl: '' })}
              aspect="banner"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Category</label>
            <select
              className="inp w-full"
              value={formData.category || 'Tax updates'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {['Tax updates', 'Guides', 'Practice', 'Career', 'Webinars'].map((c) => (
                <option key={c} value={c} className="bg-[#0C1A58]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Format *</label>
            <input
              type="text"
              required
              className="inp w-full"
              value={formData.format || ''}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="e.g. PDF · 18 pages or XLSX or Video · 60m"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isMembersOnly"
              checked={!!formData.isMembersOnly}
              onChange={(e) => setFormData({ ...formData, isMembersOnly: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isMembersOnly" className="text-xs text-[var(--fg)] cursor-pointer">
              Members Only (Requires active membership to access/download)
            </label>
          </div>
        </div>
      )}

      {/* PUBLISH STATUS TOGGLE */}
      <div className="p-3.5 rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] flex items-center justify-between mt-2">
        <div>
          <b className="block text-xs text-[var(--fg)]">Publish Status (Live Visibility)</b>
          <span className="text-[11px] text-[var(--muted)]">
            When published, immediately visible on public website and mobile PWA view.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isPublished !== false}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
        </label>
      </div>

      {/* STICKY BOTTOM ACTIONS TO PREVENT CLIPPING */}
      <div className="sticky -bottom-4 sm:-bottom-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-3.5 sm:p-4 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--line)] flex items-center justify-end gap-3 z-30 shadow-[0_-8px_20px_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-line btn-sm text-xs py-2 px-4 flex-1 sm:flex-initial"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-dark btn-sm text-xs py-2 px-5 flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-initial"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Changes' : 'Save & Publish'}
        </button>
      </div>
    </form>
  );
}
