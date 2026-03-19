import { useEffect, useState, useRef, useCallback } from 'react';
import { App,  Form } from 'antd';
import { customersAPI, promotionsAPI, remindersAPI, wahaAPI } from '../../api';

export function useDashboard() {
  const { message } = App.useApp();

  // ─── State ─────────────────────────────────────────────────────────────────

  const [stats, setStats]               = useState({ customers: 0, promotions: 0, reminders: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [sessions, setSessions]               = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [startLoading, setStartLoading]       = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData]           = useState(null);
  const [qrLoading, setQrLoading]     = useState(false);
  const [qrSession, setQrSession]     = useState('');

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendLoading, setSendLoading]     = useState(false);

  const [createForm] = Form.useForm();
  const [sendForm]   = Form.useForm();

  const pollRef      = useRef(null);
  const qrIntervalRef = useRef(null);

  // ─── Sessions ──────────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setSessionsLoading(true);
    try {
      const res  = await wahaAPI.getSessions();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setSessions(list);
      return list;
    } catch (e) {
      if (!silent) message.error('Gagal memuat sesi: ' + (e.response?.data?.error?.message || e.message));
      return [];
    } finally {
      if (!silent) setSessionsLoading(false);
    }
  }, []);

  const handleStartSession = async () => {
    setStartLoading(true);
    try {
      await wahaAPI.startSession('default');
      message.success('Sesi dimulai! Tunggu sebentar lalu scan QR code');
      createForm.resetFields();
      setTimeout(() => fetchSessions(true), 2000);
      setTimeout(() => fetchSessions(true), 5000);
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message || '';
      if (msg.toLowerCase().includes('already')) {
        message.warning('Sesi dengan nama itu sudah ada');
      } else {
        message.error('Gagal memulai sesi: ' + msg);
      }
    } finally {
      setStartLoading(false);
    }
  };

  const handleStop = async (sessionName) => {
    try {
      await wahaAPI.stopSession(sessionName);
      message.success(`Sesi "${sessionName}" dihentikan`);
      fetchSessions();
    } catch (e) {
      message.error('Gagal menghentikan sesi: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const [cust, promo, rem] = await Promise.allSettled([
        customersAPI.getAll({ limit: 1 }),
        promotionsAPI.getAll({ limit: 1 }),
        remindersAPI.getAll({ limit: 1 }),
      ]);
      setStats({
        customers : cust.value?.data?.pagination?.total  ?? 0,
        promotions: promo.value?.data?.pagination?.total ?? 0,
        reminders : rem.value?.data?.pagination?.total   ?? 0,
      });
    } catch (e) {
      console.error('Gagal fetch stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── QR Code ───────────────────────────────────────────────────────────────

  const fetchQR = useCallback(async (sessionName) => {
    setQrLoading(true);
    setQrData(null);
    try {
      const res = await wahaAPI.getQR(sessionName);
      setQrData(res.data?.data ?? res.data);
    } catch (e) {
      message.error('Gagal mengambil QR code — pastikan sesi dalam status SCAN_QR_CODE');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const handleShowQR = useCallback((sessionName) => {
    setQrSession(sessionName);
    setQrModalOpen(true);
    setQrData(null);
    fetchQR(sessionName);

    // Auto-refresh QR setiap 30 detik karena QR expires
    clearInterval(qrIntervalRef.current);
    qrIntervalRef.current = setInterval(() => fetchQR(sessionName), 30000);
  }, [fetchQR]);

  const handleCloseQR = useCallback(() => {
    setQrModalOpen(false);
    setQrData(null);
    clearInterval(qrIntervalRef.current);
    fetchSessions(true);
  }, [fetchSessions]);

  // ─── Send test message ─────────────────────────────────────────────────────

  const handleSend = async (values) => {
    setSendLoading(true);
    try {
      const digits     = values.recipient.replace(/\D/g, '');
      const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
      await wahaAPI.sendMessage({
        session  : values.session,
        recipient: normalized + '@c.us',
        content  : values.content
      });
      message.success('Pesan terkirim!');
      sendForm.resetFields();
      setSendModalOpen(false);
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal mengirim pesan');
    } finally {
      setSendLoading(false);
    }
  };

  const openSendModal  = () => setSendModalOpen(true);
  const closeSendModal = () => setSendModalOpen(false);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
    fetchSessions();
  }, [fetchStats, fetchSessions]);

  // Auto-poll sessions setiap 10 detik
  useEffect(() => {
    pollRef.current = setInterval(() => fetchSessions(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchSessions]);

  // Cleanup QR interval saat unmount
  useEffect(() => {
    return () => clearInterval(qrIntervalRef.current);
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const connectedSessions = sessions.filter(
    (s) => s.status === 'WORKING' || s.status === 'CONNECTED'
  );
  const hasConnected = connectedSessions.length > 0;
  const hasPendingQR = sessions.some((s) => s.status === 'SCAN_QR_CODE');

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    // Stats
    stats,
    statsLoading,

    // Sessions
    sessions,
    sessionsLoading,
    startLoading,
    connectedSessions,
    hasConnected,
    hasPendingQR,
    fetchSessions,
    handleStartSession,
    handleStop,

    // QR
    qrModalOpen,
    qrData,
    qrLoading,
    qrSession,
    handleShowQR,
    handleCloseQR,
    fetchQR,

    // Send
    sendModalOpen,
    sendLoading,
    openSendModal,
    closeSendModal,
    handleSend,

    // Forms
    createForm,
    sendForm,
  };
}