'use client';

/**
 * Super-Admin Ad Click Fraud Detection & Visitor Intelligence Dashboard
 *
 * Exclusively accessible to users with the 'super-admin' role.
 * Provides live monitoring, bot analysis, device cluster detection,
 * sorting/filtering, and one-click CSV evidence exports.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    Download,
    RefreshCw,
    Search,
    Filter,
    Layers,
    Activity,
    ExternalLink,
    X,
    Eye
} from 'lucide-react';
import AuthService from '@/services/AuthService';

interface VisitRecord {
    _id: string;
    visitId: string;
    brandId: string;
    gclid?: string;
    gadSource?: string;
    trafficSource: string;
    ip: string;
    country: string;
    cfTimezone?: string;
    asn?: string;
    ua: string;
    path: string;
    landingPage: string;
    params?: Record<string, any>;
    fpHash: string;
    signals?: {
        webdriver?: boolean;
        headless?: boolean;
        softwareWebGL?: boolean;
        hasLanguages?: boolean;
        platform?: string;
        cores?: number;
        memory?: number;
        screen?: { width: number; height: number };
        touchSupport?: boolean;
        timezone?: string;
        webglVendor?: string;
        webglRenderer?: string;
    };
    behaviour?: {
        pointerMoves?: number;
        touchMoves?: number;
        scrollEvents?: number;
        maxScrollDepth?: number;
        clicks?: number;
        keyPresses?: number;
        visibleTimeMs?: number;
    };
    score: number;
    why: string[];
    risk: 'Low' | 'Medium' | 'High';
    createdAt: string;
}

interface StatsData {
    totalVisits: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    brandBreakdown: Array<{ _id: string; count: number; highRisk: number }>;
    trafficBreakdown: Array<{ _id: string; count: number; highRisk: number }>;
    topIps: Array<{
        ip: string;
        hits: number;
        maxScore: number;
        country: string;
        trafficSource: string;
        reasons: string[];
    }>;
}

interface ClusterRecord {
    fpHash: string;
    visits: number;
    distinctIPs: number;
    distinctGclids: number;
    avgScore: number;
    maxScore: number;
    countries: string[];
    trafficSources: string[];
    brands: string[];
}

export default function FraudMonitoringPage() {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<'visits' | 'clusters' | 'guide'>('visits');

    // Filter states
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [daysFilter, setDaysFilter] = useState<number>(7);
    const [riskFilter, setRiskFilter] = useState<string>('all');
    const [trafficFilter, setTrafficFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState<number>(1);

    // Data states
    const [stats, setStats] = useState<StatsData | null>(null);
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [clusters, setClusters] = useState<ClusterRecord[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalVisitsCount, setTotalVisitsCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // API Base URL - Uses local proxy by default to prevent CORS & token mismatch
    const apiBase = '';

    const getAuthHeaders = useCallback(() => {
        let rawToken = '';
        try {
            const stored = localStorage.getItem('authToken');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    rawToken = parsed.accessToken || parsed.token || (typeof parsed === 'string' ? parsed : '');
                } catch {
                    rawToken = stored;
                }
            }
            if (!rawToken && typeof document !== 'undefined') {
                const match = document.cookie.match(/(^|;)\s*authToken=([^;]+)/);
                if (match) rawToken = decodeURIComponent(match[2]);
            }
        } catch {}

        return {
            'Content-Type': 'application/json',
            'Authorization': rawToken ? `Bearer ${rawToken}` : '',
            'x-brand-id': brandFilter !== 'all' ? brandFilter : 'pennyscroll'
        };
    }, [brandFilter]);

    // Check super-admin role
    useEffect(() => {
        try {
            const authState = AuthService.getInstance().getAuthState();
            const storedUser = localStorage.getItem('user');
            let role = authState?.user?.role;

            if (!role && storedUser) {
                const parsed = JSON.parse(storedUser);
                role = parsed.role;
            }

            if (role === 'super-admin') {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch {
            setIsAuthorized(false);
        }
    }, []);

    // Fetch Stats
    const fetchStats = useCallback(async () => {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const url = new URL('/api/ad-visit/admin/stats', origin);
            url.searchParams.set('brandId', brandFilter);
            url.searchParams.set('days', String(daysFilter));

            const res = await fetch(url.toString(), { credentials: 'include', headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, [brandFilter, daysFilter, getAuthHeaders]);

    // Fetch Visits
    const fetchVisits = useCallback(async () => {
        setIsLoading(true);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const url = new URL('/api/ad-visit/admin/visits', origin);
            url.searchParams.set('brandId', brandFilter);
            url.searchParams.set('risk', riskFilter);
            url.searchParams.set('trafficSource', trafficFilter);
            if (searchQuery) url.searchParams.set('search', searchQuery);
            url.searchParams.set('sortBy', sortBy);
            url.searchParams.set('sortOrder', sortOrder);
            url.searchParams.set('page', String(page));
            url.searchParams.set('limit', '25');

            const res = await fetch(url.toString(), { credentials: 'include', headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setVisits(data.visits || []);
                setTotalPages(data.totalPages || 1);
                setTotalVisitsCount(data.total || 0);
            }
        } catch (err) {
            console.error('Failed to load visits:', err);
        } finally {
            setIsLoading(false);
        }
    }, [brandFilter, riskFilter, trafficFilter, searchQuery, sortBy, sortOrder, page, getAuthHeaders]);

    // Fetch Clusters
    const fetchClusters = useCallback(async () => {
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const url = new URL('/api/ad-visit/admin/clusters', origin);
            url.searchParams.set('brandId', brandFilter);
            url.searchParams.set('days', String(daysFilter));

            const res = await fetch(url.toString(), { credentials: 'include', headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setClusters(data.clusters || []);
            }
        } catch (err) {
            console.error('Failed to load clusters:', err);
        }
    }, [brandFilter, daysFilter, getAuthHeaders]);

    // Load Data when authorized
    useEffect(() => {
        if (isAuthorized) {
            fetchStats();
            fetchVisits();
            fetchClusters();
        }
    }, [isAuthorized, fetchStats, fetchVisits, fetchClusters]);

    // Trigger CSV Export Download
    const downloadCsv = async (type: 'ips' | 'clusters' | 'gclids') => {
        setIsExporting(true);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const url = new URL('/api/ad-visit/admin/export-csv', origin);
            url.searchParams.set('type', type);
            url.searchParams.set('brandId', brandFilter);
            url.searchParams.set('days', String(daysFilter));
            url.searchParams.set('minScore', '7');

            const res = await fetch(url.toString(), { credentials: 'include', headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `suspicious-${type}-${brandFilter}-${daysFilter}d.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('CSV export failed:', err);
            alert('Failed to generate CSV export.');
        } finally {
            setIsExporting(false);
        }
    };

    // Access Denied Screen if not Super Admin
    if (isAuthorized === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                    <ShieldAlert size={36} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                <p className="text-gray-600 max-w-md mb-6">
                    This section contains sensitive ad traffic intelligence, forensic bot evidence, and click fraud telemetry.
                    Only users with the <strong>Super-Admin</strong> role are authorized to access this dashboard.
                </p>
                <Link
                    href="/admin/blogs"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Return to Admin Dashboard
                </Link>
            </div>
        );
    }

    if (isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Activity size={24} />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Ad Click Fraud & Visitor Intelligence
                            </h1>
                            <p className="text-sm text-gray-500">
                                Live monitoring, bot signal detection & Google Ads evidence collection for Penny Scroll & Brand Network
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brand & Timeframe Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={brandFilter}
                        onChange={(e) => {
                            setBrandFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">🏢 All Brands</option>
                        <option value="pennyscroll">Penny Scroll (pennyscroll.com)</option>
                        <option value="specreveal">SpecReveal (specreveal.com)</option>
                        <option value="blogzenix">BlogZenix (blogzenix.com)</option>
                        <option value="trendfiltered">TrendFiltered (trendfiltered.com)</option>
                    </select>

                    <select
                        value={daysFilter}
                        onChange={(e) => setDaysFilter(Number(e.target.value))}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={1}>Past 24 Hours</option>
                        <option value={7}>Past 7 Days</option>
                        <option value={14}>Past 14 Days</option>
                        <option value={30}>Past 30 Days</option>
                    </select>

                    {/* CSV Export Dropdown Buttons */}
                    <div className="relative group">
                        <button
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            {isExporting ? 'Exporting...' : 'Export CSV Evidence'}
                        </button>
                        <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-50 py-1">
                            <button
                                onClick={() => downloadCsv('ips')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                                <span>Suspicious IPs Report</span>
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">CSV</span>
                            </button>
                            <button
                                onClick={() => downloadCsv('clusters')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                                <span>Device Clusters (Proxies)</span>
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">CSV</span>
                            </button>
                            <button
                                onClick={() => downloadCsv('gclids')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                            >
                                <span>Suspicious GCLIDs (Ads)</span>
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <span className="text-sm font-medium">Total Tracked Visits</span>
                        <Activity size={18} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                        {stats?.totalVisits?.toLocaleString() ?? '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Across all traffic acquisition channels</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm bg-red-50/20">
                    <div className="flex items-center justify-between text-red-600 mb-2">
                        <span className="text-sm font-semibold">High Risk (Confirmed Bots)</span>
                        <ShieldAlert size={18} />
                    </div>
                    <div className="text-3xl font-extrabold text-red-600">
                        {stats?.highRisk?.toLocaleString() ?? '—'}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                        Score 7+ (Automation, rotating proxies, headless)
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm bg-yellow-50/20">
                    <div className="flex items-center justify-between text-yellow-700 mb-2">
                        <span className="text-sm font-semibold">Medium Risk (Suspicious)</span>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="text-3xl font-extrabold text-yellow-700">
                        {stats?.mediumRisk?.toLocaleString() ?? '—'}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">Score 4–6 (Multiple weak anomaly signals)</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm bg-green-50/20">
                    <div className="flex items-center justify-between text-green-700 mb-2">
                        <span className="text-sm font-semibold">Low Risk (Legitimate)</span>
                        <ShieldCheck size={18} />
                    </div>
                    <div className="text-3xl font-extrabold text-green-700">
                        {stats?.lowRisk?.toLocaleString() ?? '—'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">Score 0–3 (Normal human browsing patterns)</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 gap-8">
                <button
                    onClick={() => setActiveTab('visits')}
                    className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'visits'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Layers size={16} />
                    Visitor Activity & Audit Log ({totalVisitsCount.toLocaleString()})
                </button>

                <button
                    onClick={() => setActiveTab('clusters')}
                    className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'clusters'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ShieldAlert size={16} />
                    Device Clusters / Rotating Proxies ({clusters.length})
                </button>

                <button
                    onClick={() => setActiveTab('guide')}
                    className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'guide'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ExternalLink size={16} />
                    Google Ads Investigation & Exclusions Guide
                </button>
            </div>

            {/* TAB 1: VISITOR ACTIVITY LOG */}
            {activeTab === 'visits' && (
                <div className="space-y-4">
                    {/* Filter & Search Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by IP, GCLID, Visit ID, or Landing URL..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Risk Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 p-1 border border-gray-200 rounded-lg">
                                {['all', 'High', 'Medium', 'Low'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            setRiskFilter(r);
                                            setPage(1);
                                        }}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${riskFilter === r
                                                ? 'bg-white shadow text-gray-900'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {r === 'all' ? 'All Risks' : r}
                                    </button>
                                ))}
                            </div>

                            {/* Traffic Source Filter */}
                            <select
                                value={trafficFilter}
                                onChange={(e) => {
                                    setTrafficFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Traffic</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="Google Organic">Google Organic</option>
                                <option value="Bing Organic">Bing Organic</option>
                                <option value="Facebook / Instagram">Meta (FB / IG)</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Direct">Direct</option>
                                <option value="Referral">Referral</option>
                            </select>

                            {/* Sort Options */}
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [by, order] = e.target.value.split('-');
                                    setSortBy(by);
                                    setSortOrder(order as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="createdAt-asc">Oldest First</option>
                                <option value="score-desc">Highest Score First</option>
                                <option value="score-asc">Lowest Score First</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">Brand</th>
                                        <th className="px-4 py-3">IP & Country</th>
                                        <th className="px-4 py-3">Traffic Source</th>
                                        <th className="px-4 py-3">Risk & Score</th>
                                        <th className="px-4 py-3">Forensic Reasons</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <RefreshCw className="animate-spin inline-block text-blue-600 mr-2" size={20} />
                                                Loading visitor records...
                                            </td>
                                        </tr>
                                    ) : visits.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-400">
                                                No visitor records matching the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        visits.map((visit) => {
                                            const riskColor =
                                                visit.risk === 'High'
                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                    : visit.risk === 'Medium'
                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                        : 'bg-green-100 text-green-700 border-green-200';

                                            return (
                                                <tr key={visit._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                        {new Date(visit.createdAt).toLocaleString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="font-semibold text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                                            {visit.brandId || 'pennyscroll'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="font-mono text-xs font-semibold text-gray-900">
                                                            {visit.ip}
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                                            <span>{visit.country || 'UNKNOWN'}</span>
                                                            {visit.asn && <span>• {visit.asn}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                            {visit.trafficSource}
                                                        </span>
                                                        {visit.gclid && (
                                                            <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[120px]">
                                                                GCLID: {visit.gclid}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${riskColor}`}
                                                        >
                                                            {visit.risk} ({visit.score})
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs max-w-xs truncate">
                                                        {visit.why && visit.why.length > 0 ? (
                                                            <span className="text-gray-700">
                                                                {visit.why.join('; ')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">Normal human session</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => setSelectedVisit(visit)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                        >
                                                            <Eye size={13} />
                                                            Inspect
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                Page {page} of {totalPages} ({totalVisitsCount.toLocaleString()} total visits)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: DEVICE CLUSTERS / ROTATING PROXIES */}
            {activeTab === 'clusters' && (
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        <strong>Rotating Proxy Detection:</strong> A device cluster is detected when an identical browser hardware fingerprint hash (SHA-256) is observed connecting across multiple distinct IP addresses within a short timeframe. This is a common hallmark of automated scrapers and residential proxy networks.
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Fingerprint Hash (SHA-256)</th>
                                    <th className="px-4 py-3">Distinct IPs</th>
                                    <th className="px-4 py-3">Distinct GCLIDs</th>
                                    <th className="px-4 py-3">Total Visits</th>
                                    <th className="px-4 py-3">Avg Score</th>
                                    <th className="px-4 py-3">Countries</th>
                                    <th className="px-4 py-3">Brands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clusters.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400">
                                            No suspicious multi-IP device clusters detected in the selected timeframe.
                                        </td>
                                    </tr>
                                ) : (
                                    clusters.map((c) => (
                                        <tr key={c.fpHash} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-900 font-semibold truncate max-w-xs">
                                                {c.fpHash}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                                    {c.distinctIPs} IPs
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{c.distinctGclids}</td>
                                            <td className="px-4 py-3 font-semibold">{c.visits}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-xs">{c.avgScore}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">{c.countries.join(', ')}</td>
                                            <td className="px-4 py-3 text-xs">
                                                {c.brands.map((b) => (
                                                    <span key={b} className="bg-gray-100 px-1.5 py-0.5 rounded mr-1">
                                                        {b}
                                                    </span>
                                                ))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: GOOGLE ADS INVESTIGATION GUIDE */}
            {activeTab === 'guide' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 text-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Google Ads IP Exclusions & Invalid Activity Reporting
                        </h2>
                        <p className="text-sm text-gray-600">
                            Follow this step-by-step workflow to exclude repeat click-fraud offenders and submit refund requests.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-blue-600" />
                                1. How to Exclude Confirmed IPs in Google Ads
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 leading-relaxed">
                                <li>Click <strong>Export CSV Evidence</strong> above and choose <strong>Suspicious IPs Report</strong>.</li>
                                <li>Review the IPs that show repeat hits (5+ hits) and automated reasons like <code>navigator.webdriver</code>.</li>
                                <li>Log in to your <strong>Google Ads</strong> console.</li>
                                <li>Select Campaign <code>Growi US 1</code> → <strong>Settings</strong> → <strong>Additional settings</strong>.</li>
                                <li>Click on <strong>IP exclusions</strong>.</li>
                                <li>Paste the confirmed IPs (one per line) and click <strong>Save</strong>.</li>
                                <li><strong className="text-red-600">Important:</strong> Google Ads imposes a maximum limit of 500 excluded IPs per campaign. Do not exclude single low-confidence visits.</li>
                            </ol>
                        </div>

                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Download size={18} className="text-green-600" />
                                2. Submitting an Invalid Click Investigation to Google
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-xs text-gray-600 leading-relaxed">
                                <li>Download the <strong>Suspicious GCLIDs</strong> report.</li>
                                <li>Go to Google Ads Help → <strong>Contact Us</strong> → <strong>Submit an Invalid Clicks Investigation</strong>.</li>
                                <li>Attach the CSV file demonstrating zero user interaction, automated User-Agents, and anomalous timestamps.</li>
                                <li>Note that with <code>gad_source=1</code> (GCLID disabled), provide the <strong>Suspicious IPs</strong> report alongside timestamps and ValueTrack keyword parameters as evidence.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL (INSPECT VISITOR) */}
            {selectedVisit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Visitor Forensic Dossier</h3>
                                <p className="text-xs text-gray-500 font-mono">Visit ID: {selectedVisit.visitId}</p>
                            </div>
                            <button
                                onClick={() => setSelectedVisit(null)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Top Summary */}
                        <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg text-xs">
                            <div>
                                <span className="text-gray-400 block">Brand</span>
                                <span className="font-bold text-gray-900">{selectedVisit.brandId}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Risk Level</span>
                                <span className="font-bold text-red-600">
                                    {selectedVisit.risk} (Score: {selectedVisit.score})
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Traffic Source</span>
                                <span className="font-bold text-blue-600">{selectedVisit.trafficSource}</span>
                            </div>
                        </div>

                        {/* Reasons */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Triggered Fraud Signals</h4>
                            <div className="space-y-1">
                                {selectedVisit.why && selectedVisit.why.length > 0 ? (
                                    selectedVisit.why.map((reason, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs flex items-center gap-2"
                                        >
                                            <ShieldAlert size={14} className="flex-shrink-0" />
                                            <span>{reason}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 bg-green-50 text-green-700 border border-green-200 rounded text-xs">
                                        No suspicious bot signals triggered. Normal user behaviour.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Behaviour */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">User Behaviour Activity</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 bg-gray-50 rounded border">
                                    <span className="text-gray-400 block">Pointer Moves</span>
                                    <span className="font-bold">{selectedVisit.behaviour?.pointerMoves ?? 0}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded border">
                                    <span className="text-gray-400 block">Touch Moves</span>
                                    <span className="font-bold">{selectedVisit.behaviour?.touchMoves ?? 0}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded border">
                                    <span className="text-gray-400 block">Clicks</span>
                                    <span className="font-bold">{selectedVisit.behaviour?.clicks ?? 0}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded border">
                                    <span className="text-gray-400 block">Scroll Depth</span>
                                    <span className="font-bold">{selectedVisit.behaviour?.maxScrollDepth ?? 0}%</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded border">
                                    <span className="text-gray-400 block">Key Activity</span>
                                    <span className="font-bold">{selectedVisit.behaviour?.keyPresses ?? 0}</span>
                                </div>
                                <div className="p-2 bg-gray-50 rounded border col-span-2">
                                    <span className="text-gray-400 block">Active Visible Time</span>
                                    <span className="font-bold">
                                        {((selectedVisit.behaviour?.visibleTimeMs ?? 0) / 1000).toFixed(1)} seconds
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Environment & Hardware Signals */}
                        <div>
                            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Hardware & Browser Profile</h4>
                            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1.5 font-mono text-gray-700">
                                <div><strong>IP:</strong> {selectedVisit.ip} ({selectedVisit.country || 'UNKNOWN'})</div>
                                <div><strong>User Agent:</strong> {selectedVisit.ua}</div>
                                <div><strong>Platform:</strong> {selectedVisit.signals?.platform || 'N/A'}</div>
                                <div><strong>CPU Cores:</strong> {selectedVisit.signals?.cores || 'N/A'} | <strong>Memory:</strong> {selectedVisit.signals?.memory ? `${selectedVisit.signals.memory} GB` : 'N/A'}</div>
                                <div><strong>Screen:</strong> {selectedVisit.signals?.screen?.width}x{selectedVisit.signals?.screen?.height}</div>
                                <div><strong>WebGL Vendor:</strong> {selectedVisit.signals?.webglVendor || 'N/A'}</div>
                                <div><strong>WebGL Renderer:</strong> {selectedVisit.signals?.webglRenderer || 'N/A'}</div>
                                <div><strong>Fingerprint Hash:</strong> {selectedVisit.fpHash}</div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedVisit(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-300"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

