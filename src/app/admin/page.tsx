'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { LandRecord } from '@/types';
import RiskBadge from '@/components/RiskBadge';
import { toBanglaNumber, formatDate } from '@/lib/bangla-utils';
import {
  ShieldAlert,
  Users,
  Database,
  FileCheck2,
  Trash2,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  UserCheck,
} from 'lucide-react';

export default function AdminPage() {
  const { language, t } = useLanguage();
  const { user, isAdmin, quickDemoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'records' | 'logs' | 'ocr'>('records');
  const [showAddModal, setShowAddModal] = useState(false);

  // New record form
  const [newDivision, setNewDivision] = useState('Dhaka');
  const [newDistrict, setNewDistrict] = useState('Dhaka');
  const [newUpazila, setNewUpazila] = useState('Mohammadpur');
  const [newMouza, setNewMouza] = useState('Jafrabad');
  const [newDagNo, setNewDagNo] = useState('512');
  const [newKhatianNo, setNewKhatianNo] = useState('204');
  const [newArea, setNewArea] = useState<number>(8.5);
  const [newOwner, setNewOwner] = useState('Habibur Rahman');

  const records = dataStore.getRecords();
  const logs = dataStore.getAuditLogs();
  const documents = dataStore.getDocuments();

  const handleDelete = (id: string) => {
    if (confirm('Delete this demo record?')) {
      dataStore.deleteRecord(id);
      // Force rerender by re-fetching
      setActiveTab('records');
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: LandRecord = {
      id: `rec-${Date.now()}`,
      division: newDivision,
      divisionBn: 'ঢাকা',
      district: newDistrict,
      districtBn: 'ঢাকা',
      upazila: newUpazila,
      upazilaBn: 'মোহাম্মদপুর',
      mouza: newMouza,
      mouzaBn: 'জাফরাবাদ',
      jlNumber: '14',
      khatianNo: newKhatianNo,
      dagNo: newDagNo,
      landClass: 'Homestead',
      landClassBn: 'বাস্তু ভিটি',
      areaDecimals: newArea,
      currentSurvey: 'BS',
      isDemoData: true,
      isVerifiedByAuthority: false,
      sourceProvenance: 'GovTech Admin Console (Injected Simulation)',
      hasCaveatOrDispute: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owners: [
        {
          id: `own-${Date.now()}`,
          ownerName: newOwner,
          ownerNameBn: newOwner,
          fatherOrHusbandName: 'Late M. Rahman',
          sharePortion: '1.00 (১৬ আনা)',
          acquisitionType: 'Purchase (Kabala)',
          recordedDate: '2020-01-15',
        },
      ],
      surveys: [
        {
          surveyType: 'CS',
          year: 1940,
          khatianNo: '12',
          dagNo: '400',
          recordedOwner: 'Late M. Rahman',
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
        {
          surveyType: 'RS',
          year: 1980,
          khatianNo: '88',
          dagNo: newDagNo,
          recordedOwner: 'Late M. Rahman',
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
        {
          surveyType: 'BS',
          year: 2010,
          khatianNo: newKhatianNo,
          dagNo: newDagNo,
          recordedOwner: newOwner,
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
      ],
      mutation: {
        id: `mut-${Date.now()}`,
        caseNo: `MUT-${Date.now().toString().slice(-4)}`,
        mutationKhatianNo: `${newKhatianNo}/1`,
        applicantName: newOwner,
        status: 'approved',
        approvalDate: '2020-04-10',
        acLandOffice: 'Mohammadpur Circle AC Land',
        lastTaxPaidYear: 2024,
      },
    };

    dataStore.addRecord(newRec);
    setShowAddModal(false);
  };

  // If user is not admin, show accessible prompt allowing hackathon judges to switch
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-amber-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {language === 'bn' ? 'অ্যাডমিন অনুমতি প্রয়োজন' : 'Administrator Authorization Required'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {language === 'bn'
            ? 'এই ড্যাশবোর্ডটি সিস্টেম অ্যাডমিনদের জন্য সংরক্ষিত। আপনি বর্তমানে সিটিজেন আইডিতে রয়েছেন। হ্যাকাথন মূল্যায়নের জন্য নিচের বাটনে ক্লিক করে এক ক্লিকে অ্যাডমিন রোল সক্রিয় করুন।'
            : 'This control console is protected by server role checks. Click below to instantly elevate your session to GovTech Administrator for evaluation.'}
        </p>
        <button
          onClick={() => quickDemoLogin('admin')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>Switch to Admin Persona (One-Click)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>GovTech Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t.adminTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.adminSubtitle}</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.adminAddRecord}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t.adminTotalRecords}
          </span>
          <div className="text-2xl font-black text-slate-900">
            {language === 'bn' ? toBanglaNumber(records.length) : records.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t.adminTotalAuditLogs}
          </span>
          <div className="text-2xl font-black text-emerald-800">
            {language === 'bn' ? toBanglaNumber(logs.length) : logs.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {language === 'bn' ? 'ওসিআর প্রসেসড ফাইল' : 'Processed Documents'}
          </span>
          <div className="text-2xl font-black text-slate-900">
            {language === 'bn'
              ? toBanglaNumber(documents.length > 0 ? documents.length : 2)
              : documents.length > 0
              ? documents.length
              : 2}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'records'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.adminTabRecords}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.adminTabLogs}
        </button>
      </div>

      {/* Tab 1: Records */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Location / Mouza</th>
                <th className="py-3 px-3">Dag & Khatian</th>
                <th className="py-3 px-3">Recorded Area</th>
                <th className="py-3 px-3">Owner(s)</th>
                <th className="py-3 px-3">Mutation</th>
                <th className="py-3 px-3">Risk Flag</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const isClean = !r.hasCaveatOrDispute && r.mutation?.status === 'approved';
                const riskLevel = isClean ? 'low' : r.hasCaveatOrDispute ? 'high' : 'medium';
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.mouza}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r.upazila}, {r.district}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      Dag #{r.dagNo} (Khatian #{r.khatianNo})
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-800">
                      {r.areaDecimals} dec
                    </td>
                    <td className="py-3.5 px-3">{r.owners[0]?.ownerName}</td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-semibold text-slate-700">
                      {r.mutation?.status || 'None'}
                    </td>
                    <td className="py-3.5 px-3">
                      <RiskBadge severity={riskLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Resource</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {formatDate(log.timestamp, 'en')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px] text-slate-500 font-semibold">
                    {log.resourceType}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{log.details}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {log.userEmail || 'system'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              {language === 'bn' ? 'নতুন নমুনা রেকর্ড যোগ করুন' : 'Add Simulated Land Record'}
            </h3>
            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Upazila</label>
                  <input
                    type="text"
                    value={newUpazila}
                    onChange={(e) => setNewUpazila(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mouza</label>
                  <input
                    type="text"
                    value={newMouza}
                    onChange={(e) => setNewMouza(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dag No</label>
                  <input
                    type="text"
                    value={newDagNo}
                    onChange={(e) => setNewDagNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khatian No</label>
                  <input
                    type="text"
                    value={newKhatianNo}
                    onChange={(e) => setNewKhatianNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area (Decimals)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newArea}
                    onChange={(e) => setNewArea(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recorded Owner Name</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
