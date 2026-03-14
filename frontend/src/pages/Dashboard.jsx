import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Typography, Space, Tag,
  Button, Form, Input, Modal, Spin, message, Alert, Badge
} from 'antd';
import {
  TeamOutlined, NotificationOutlined, ClockCircleOutlined,
  WhatsAppOutlined, PlayCircleOutlined, StopOutlined,
  QrcodeOutlined, ReloadOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SendOutlined
} from '@ant-design/icons';
import { customersAPI, promotionsAPI, remindersAPI, wahaAPI } from '../api';

const { Title, Text } = Typography;

const SESSION_COLOR = {
  WORKING: 'success', CONNECTED: 'success',
  SCAN_QR_CODE: 'warning', STARTING: 'processing',
  STOPPED: 'default', FAILED: 'error'
};

const SESSION_LABEL = {
  WORKING: 'Terhubung',
  CONNECTED: 'Terhubung',
  SCAN_QR_CODE: 'Perlu Scan QR',
  STARTING: 'Memulai...',
  STOPPED: 'Tidak Aktif',
  FAILED: 'Gagal'
};

function StatCard({ title, value, icon, color, suffix }) {
  return (
    <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic
          title={title}
          value={value}
          suffix={suffix}
          valueStyle={{ color, fontWeight: 700, fontSize: 28 }}
        />
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  // Stats
  const [stats, setStats] = useState({ customers: 0, promotions: 0, reminders: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // WhatsApp sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSession, setQrSession] = useState('');
  const qrIntervalRef = useRef(null);

  // Send test modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  // Start session
  const [startLoading, setStartLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [sendForm] = Form.useForm();

  // Polling ref
  const pollRef = useRef(null);

  // ─── Fetch sessions ────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setSessionsLoading(true);
    try {
      const res = await wahaAPI.getSessions();
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

  // ─── Fetch stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [cust, promo, rem] = await Promise.allSettled([
          customersAPI.getAll({ limit: 1 }),
          promotionsAPI.getAll({ limit: 1 }),
          remindersAPI.getAll({ limit: 1 }),
        ]);
        setStats({
          customers: cust.value?.data?.pagination?.total ?? 0,
          promotions: promo.value?.data?.pagination?.total ?? 0,
          reminders: rem.value?.data?.pagination?.total ?? 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setStatsLoading(false);
      }
    };
    load();
    fetchSessions();
  }, [fetchSessions]);

  // Auto-poll sessions every 10 seconds so status updates automatically
  useEffect(() => {
    pollRef.current = setInterval(() => fetchSessions(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchSessions]);

  // ─── Start session ─────────────────────────────────────────────────────────
  const handleStartSession = async (values) => {
    setStartLoading(true);
    try {
      const name = 'default';
      await wahaAPI.startSession(name);
      message.success('Sesi dimulai! Tunggu sebentar lalu scan QR code');
      createForm.resetFields();
      // Poll a few times quickly after start
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

  // ─── Stop session ──────────────────────────────────────────────────────────
  const handleStop = async (sessionName) => {
    try {
      await wahaAPI.stopSession(sessionName);
      message.success(`Sesi "${sessionName}" dihentikan`);
      fetchSessions();
    } catch (e) {
      message.error('Gagal menghentikan sesi: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  // ─── Show QR ───────────────────────────────────────────────────────────────
  const fetchQR = async (sessionName) => {
    setQrLoading(true);
    setQrData(null);
    try {
      const res = await wahaAPI.getQR(sessionName);
      // WAHA can return different structures: { data: { imageBase64, qr } } or { data: "data:image/..." }
      const raw = res.data?.data ?? res.data;
      setQrData(raw);
    } catch (e) {
      message.error('Gagal mengambil QR code — pastikan sesi dalam status SCAN_QR_CODE');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleShowQR = (sessionName) => {
    setQrSession(sessionName);
    setQrModalOpen(true);
    setQrData(null);
    fetchQR(sessionName);

    // Auto-refresh QR every 30 seconds (QR codes expire)
    clearInterval(qrIntervalRef.current);
    qrIntervalRef.current = setInterval(() => fetchQR(sessionName), 30000);
  };

  const handleCloseQR = () => {
    setQrModalOpen(false);
    setQrData(null);
    clearInterval(qrIntervalRef.current);
    fetchSessions(true); // refresh status after closing
  };

  useEffect(() => {
    return () => clearInterval(qrIntervalRef.current);
  }, []);

  // ─── Send test ─────────────────────────────────────────────────────────────
  const handleSend = async (values) => {
    setSendLoading(true);
    try {
      // Normalize phone number: strip non-digits, ensure no leading 0
      const digits = values.recipient.replace(/\D/g, '');
      const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
      const chatId = normalized + '@c.us';
      await wahaAPI.sendMessage({
        session: values.session,
        recipient: chatId,
        content: values.content
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

  // ─── Derived state ─────────────────────────────────────────────────────────
  const connectedSessions = sessions.filter(s => s.status === 'WORKING' || s.status === 'CONNECTED');
  const hasConnected = connectedSessions.length > 0;
  const hasPendingQR = sessions.some(s => s.status === 'SCAN_QR_CODE');

  // ─── Render QR content ─────────────────────────────────────────────────────
  const renderQR = () => {
    if (qrLoading) return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <br /><br />
        <Text type="secondary">Memuat QR Code...</Text>
      </div>
    );
    if (!qrData) return null;

    // Handle different WAHA QR response formats
    const imageSrc = typeof qrData === 'string' && qrData.startsWith('data:')
      ? qrData
      : qrData?.imageBase64 || qrData?.image || null;

    return (
      <div style={{ textAlign: 'center', padding: 8 }}>
        {imageSrc ? (
          <img src={imageSrc} alt="QR Code" style={{ maxWidth: 260, width: '100%', borderRadius: 8 }} />
        ) : qrData?.qr ? (
          <div style={{
            background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb',
            fontFamily: 'monospace', fontSize: 9, lineHeight: 1.2, letterSpacing: '-0.5px',
            wordBreak: 'break-all'
          }}>
            {qrData.qr}
          </div>
        ) : (
          <pre style={{ fontSize: 10, textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
            {JSON.stringify(qrData, null, 2)}
          </pre>
        )}
        <div style={{ marginTop: 16, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#166534' }}>
            📱 Buka WhatsApp → Setelan → Perangkat Tertaut → Tautkan Perangkat → Scan QR
          </Text>
        </div>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
          QR otomatis diperbarui setiap 30 detik
        </Text>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Selamat datang di Jawara WA Admin</Text>
      </div>

      {/* ── WhatsApp Session Panel ─────────────────────────────────────────── */}
      <Card
        style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb' }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Card header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <Space>
            <WhatsAppOutlined style={{ color: '#16a34a', fontSize: 18 }} />
            <Text strong style={{ fontSize: 15 }}>Koneksi WhatsApp</Text>
            {hasConnected && (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {connectedSessions.length} sesi aktif
              </Tag>
            )}
            {hasPendingQR && !hasConnected && (
              <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                Perlu scan QR
              </Tag>
            )}
          </Space>
          <Space>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => fetchSessions()}
              loading={sessionsLoading}
            >
              Refresh
            </Button>
            {hasConnected && (
              <Button
                size="small"
                icon={<SendOutlined />}
                onClick={() => setSendModalOpen(true)}
              >
                Test Kirim Pesan
              </Button>
            )}
          </Space>
        </div>

        <div style={{ padding: 20 }}>
          <Row gutter={[16, 16]}>
            {/* Start new session */}
            <Col xs={24} md={8}>
              <div style={{
                border: '1px dashed #d1d5db',
                borderRadius: 10,
                padding: '20px 16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  ➕ Mulai Sesi Baru
                </Text>
                <Form form={createForm} layout="vertical" onFinish={handleStartSession}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    icon={<PlayCircleOutlined />}
                    loading={startLoading}
                    style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 6 }}
                  >
                    Mulai Sesi
                  </Button>
                </Form>
              </div>
            </Col>

            {/* Active sessions list */}
            <Col xs={24} md={16}>
              {sessionsLoading && sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : sessions.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  icon={<WhatsAppOutlined />}
                  message="Belum ada sesi WhatsApp"
                  description={
                    <span>
                      Mulai sesi baru di panel kiri, tunggu beberapa detik, lalu scan QR code untuk menghubungkan akun WhatsApp Anda.
                    </span>
                  }
                  style={{ borderRadius: 10 }}
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {sessions.map(session => {
                    const isWorking = session.status === 'WORKING' || session.status === 'CONNECTED';
                    const needsQR = session.status === 'SCAN_QR_CODE';
                    return (
                      <div
                        key={session.name}
                        style={{
                          border: `1px solid ${isWorking ? '#bbf7d0' : needsQR ? '#fed7aa' : '#e5e7eb'}`,
                          borderRadius: 10,
                          padding: '12px 16px',
                          background: isWorking ? '#f0fdf4' : needsQR ? '#fff7ed' : '#fafafa',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8
                        }}
                      >
                        <Space>
                          <WhatsAppOutlined style={{ color: isWorking ? '#16a34a' : '#9ca3af', fontSize: 20 }} />
                          <div>
                            <Text strong style={{ display: 'block' }}>{session.name}</Text>
                            <Space size={4}>
                              <Badge status={SESSION_COLOR[session.status] || 'default'} />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {SESSION_LABEL[session.status] || session.status}
                              </Text>
                              {session.me?.pushname && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  · {session.me.pushname}
                                </Text>
                              )}
                              {session.me?.id && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  · {session.me.id.replace('@c.us', '')}
                                </Text>
                              )}
                            </Space>
                          </div>
                        </Space>
                        <Space>
                          {needsQR && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<QrcodeOutlined />}
                              onClick={() => handleShowQR(session.name)}
                              style={{ background: '#d97706', borderColor: '#d97706' }}
                            >
                              Scan QR
                            </Button>
                          )}
                          {isWorking && (
                            <Button
                              size="small"
                              icon={<QrcodeOutlined />}
                              onClick={() => handleShowQR(session.name)}
                            >
                              QR
                            </Button>
                          )}
                          <Button
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            onClick={() => handleStop(session.name)}
                          >
                            Stop
                          </Button>
                        </Space>
                      </div>
                    );
                  })}
                </Space>
              )}
            </Col>
          </Row>
        </div>
      </Card>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Total Customer"
            value={statsLoading ? '-' : stats.customers}
            icon={<TeamOutlined />}
            color="#16a34a"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Total Promosi"
            value={statsLoading ? '-' : stats.promotions}
            icon={<NotificationOutlined />}
            color="#3B82F6"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Total Reminder"
            value={statsLoading ? '-' : stats.reminders}
            icon={<ClockCircleOutlined />}
            color="#8B5CF6"
          />
        </Col>
      </Row>

      {/* ── QR Modal ──────────────────────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>QR Code — Sesi "{qrSession}"</span>
          </Space>
        }
        open={qrModalOpen}
        onCancel={handleCloseQR}
        footer={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => fetchQR(qrSession)}
            loading={qrLoading}
          >
            Refresh QR
          </Button>,
          <Button key="close" onClick={handleCloseQR}>
            Tutup
          </Button>
        ]}
        width={360}
        destroyOnClose
      >
        {renderQR()}
      </Modal>

      {/* ── Send Test Modal ───────────────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>Test Kirim Pesan</span>
          </Space>
        }
        open={sendModalOpen}
        onCancel={() => setSendModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={handleSend}
          style={{ marginTop: 16 }}
          initialValues={{ session: connectedSessions[0]?.name || 'default' }}
        >
          <Form.Item
            name="recipient"
            label="Nomor Tujuan"
            rules={[{ required: true, message: 'Nomor tujuan wajib diisi' }]}
            extra="Format: 628123456789 atau 08123456789"
          >
            <Input placeholder="628123456789" />
          </Form.Item>
          <Form.Item name="content" label="Pesan" rules={[{ required: true, message: 'Pesan wajib diisi' }]}>
            <Input.TextArea rows={3} placeholder="Tulis pesan..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSendModalOpen(false)}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={sendLoading}
                icon={<SendOutlined />}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                Kirim
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
