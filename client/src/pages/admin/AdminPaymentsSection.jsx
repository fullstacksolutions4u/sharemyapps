import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, CreditCard, ChevronLeft, ChevronRight, ExternalLink, Trash2, Download } from 'lucide-react';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmt(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function fmtPdf(paise) {
  return `Rs. ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function amountInWords(amount) {
  if (amount === 0) return 'Zero Rupees Only';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  let num = Math.floor(amount);
  if ((num = num.toString()).length > 9) return 'Overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + ' Rupees Only';
}

function packLabel(p) {
  if (p.pack && p.pack.startsWith('placement_')) {
    return p.pack.replace('placement_', '').replace(/\b\w/g, c => c.toUpperCase());
  }
  if (p.pack && p.pack.startsWith('unlock_')) {
    return p.pack.replace('unlock_', '').replace(/\b\w/g, c => c.toUpperCase());
  }
  return `${p.analysesGranted} JD ${p.analysesGranted === 1 ? 'analysis' : 'analyses'}`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPaymentsSection() {
  const [data, setData]     = useState(null);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p) => {
    setLoading(true);
    api.get(`/admin/payments?page=${p}`)
      .then(r => { setData(r.data); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await api.delete(`/admin/payments/${id}`);
      setData(prev => ({
        ...prev,
        payments: prev.payments.filter(p => p._id !== id),
        total: prev.total - 1,
        totalTransactions: prev.totalTransactions - 1
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting payment');
    }
  };

  const handleDownloadInvoice = (p) => {
    const doc = new jsPDF();
    
    const generate = () => {
      doc.setFontSize(22);
      doc.setTextColor(0, 82, 204);
      doc.text("INVOICE", 196, 40, null, null, "right");
      
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text(`Invoice Number: INV-${p._id.slice(-6).toUpperCase()}`, 14, 60);
      doc.text(`Date of Issue: ${new Date(p.createdAt).toLocaleDateString('en-IN')}`, 14, 67);
      doc.text(`Transaction ID: ${p.razorpayPaymentId}`, 14, 74);
      
      doc.text(`Billed To:`, 14, 90);
      doc.setFont(undefined, 'bold');
      doc.text(`${p.user?.name || 'Customer'}`, 14, 97);
      doc.setFont(undefined, 'normal');
      doc.text(`${p.user?.email || 'N/A'}`, 14, 104);
      
      autoTable(doc, {
        startY: 115,
        head: [['Description', 'Amount']],
        body: [
          [`Payment for ${packLabel(p)} feature unlock`, fmtPdf(p.amountPaise)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 166, 147], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      
      const finalY = doc.lastAutoTable.finalY || 110;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Paid: ${fmtPdf(p.amountPaise)}`, 14, finalY + 15);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text(`Amount in Words: ${amountInWords(p.amountPaise / 100)}`, 14, finalY + 22);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text("Empowering developers to build the future.", 105, finalY + 40, null, null, "center");
      
      doc.save(`Invoice_${p.razorpayPaymentId}.pdf`);
    };

    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 14, 32, 10, 10);
      doc.setFontSize(20);
      doc.setTextColor(0, 166, 147);
      doc.setFont(undefined, 'bold');
      doc.text("ShareMyApps", 27, 40);
      generate();
    };
    img.onerror = () => {
      doc.setFontSize(22);
      doc.setTextColor(0, 166, 147);
      doc.setFont(undefined, 'bold');
      doc.text("ShareMyApps", 14, 40);
      generate();
    };
  };

  useEffect(() => {
    api.get('/admin/payments?page=1')
      .then(r => { setData(r.data); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-text mb-6">Transactions</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data ? fmt(data.totalRevenuePaise) : '—'}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Transactions</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data ? data.totalTransactions : '—'}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Avg per Sale</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data && data.totalTransactions > 0
              ? fmt(Math.round(data.totalRevenuePaise / data.totalTransactions))
              : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-text">Transaction History</p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data?.payments?.length ? (
          <div className="p-12 text-center text-muted text-sm">No payments yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Recruiter</th>
                    <th className="text-left px-5 py-3">Pack</th>
                    <th className="text-left px-5 py-3">Amount</th>
                    <th className="text-left px-5 py-3">Payment ID</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.payments.map(p => (
                    <tr key={p._id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-text">{p.user?.name || '—'}</p>
                        <p className="text-[11px] text-muted">{p.user?.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent/10 text-accent">
                          {packLabel(p)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-text">
                        {fmt(p.amountPaise)}
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline font-mono"
                        >
                          {p.razorpayPaymentId.slice(0, 16)}…
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{timeAgo(p.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          Success
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right flex items-center justify-end gap-3 h-full pt-4">
                        <button onClick={() => handleDownloadInvoice(p)} className="text-muted hover:text-[#0052CC] transition-colors" title="Download Invoice">
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="text-muted hover:text-red-500 transition-colors" title="Delete Payment">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted">
                  Page {data.page} of {data.pages} · {data.total} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page === data.pages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
