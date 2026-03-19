import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Button, Tag, Space, Typography, Alert, Row, Col,
  Form, Input, Modal, Spin, message, Divider, Tooltip, Badge
} from 'antd';
import {
  WhatsAppOutlined, PlayCircleOutlined, StopOutlined,
  QrcodeOutlined, ReloadOutlined, SendOutlined,
  WarningOutlined, ThunderboltOutlined, CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { wahaAPI } from '../api';

const { Title, Text } = Typography;

// Status yang dianggap "stuck" dan butuh force restart
const STUCK_STATUSES   = ['STARTING', 'SCAN_QR_CODE'];
const RUNNING_STATUSES = ['WORKING', 'CONNECTED', 'ONLINE'];

const SESSION_COLOR = {
  WORKING    : 'green',
  CONNECTED  : 'green',
  ONLINE     : 'green',
  SCAN_QR_CODE: 'orange',
  STARTING   : 'blue',
  STOPPED    : 'default',
  FAILED     : 'red',
  LOGOUT     : 'default'
};

const SESSION_LABEL = {
  WORKING    : 'Terhubung',
  CONNECTED  : 'Terhubung',
  ONLINE     : 'Online',
  SCAN_QR_CODE: 'Perlu Scan QR',
  STARTING   : 'Memulai...',
  STOPPED    : 'Berhenti',
  FAILED     : 'Gagal',
  LOGOUT     : 'Logout'
};

// Berapa detik polling sekali saat session sedang dalam proses
const POLL_INTERVAL_MS = 3000;
// Berapa lama maksimal nunggu sebelum anggap stuck (ms)
const STUCK_TIMEOUT_MS = 45000;

export default function Whatsapp() {
  const [sessions, setSessions]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [startingName, setStartingName] = useState(''); // session yang sedang dalam proses start

  const [qrData, setQrData]             = useState(null);
  const [qrLoading, setQrLoading]       = useState(false);
  const [qrSession, setQrSession]       = useState('');
  const [qrModalOpen, setQrModalOpen]   = useState(false);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendLoading, setSendLoading]     = useState(false);

  const [forceRestarting, setForceRestarting] = useState(''); // nama session yg sedang force restart

  const [createForm] = Form.useForm();
  const [sendForm]   = Form.useForm();

  // Ref untuk polling interval
  const pollRef       = useRef(null);
  const stuckTimerRef = useRef(null);

  // ── fetch all sessions ───────────────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await wahaAPI.getSessions();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setSessions(list);
      return list;
    } catch (e) {
      if (!silent) message.error('Gagal memuat sesi: ' + (e.response?.data?.error?.message || e.message));
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── polling: aktif saat ada session yg sedang STARTING ──────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current)       { clearInterval(pollRef.current); pollRef.current = null; }
    if (stuckTimerRef.current) { clearTimeout(stuckTimerRef.current);  stuckTimerRef.current = null; }
  }, []);

  const startPolling = useCallback((sessionName) => {
    stopPolling();

    console.log(`[Poll] Mulai polling status session "${sessionName}"`);

    pollRef.current = setInterval(async () => {
      const list = await fetchSessions(true);
      const target = list.find((s) => s.name === sessionName);

      if (!target) { stopPolling(); setStartingName(''); return; }

      // Kalau sudah RUNNING atau SCAN_QR_CODE → berhenti polling
      if (RUNNING_STATUSES.includes(target.status)) {
        console.log(`[Poll] "${sessionName}" sudah RUNNING, stop polling`);
        stopPolling();
        setStartingName('');
        message.success(`Session "${sessionName}" berhasil terhubung!`);
        return;
      }

      if (target.status === 'SCAN_QR_CODE') {
        console.log(`[Poll] "${sessionName}" butuh scan QR, stop polling`);
        stopPolling();
        setStartingName('');
        return;
      }

      // Kalau FAILED/STOPPED → stop polling, beri tahu user
      if (['FAILED', 'STOPPED', 'LOGOUT'].includes(target.status)) {
        console.log(`[Poll] "${sessionName}" status ${target.status}, stop polling`);
        stopPolling();
        setStartingName('');
        message.warning(`Session "${sessionName}" berstatus ${target.status}`);
      }
    }, POLL_INTERVAL_MS);

    // Timeout: kalau masih STARTING setelah STUCK_TIMEOUT_MS → anggap stuck
    stuckTimerRef.current = setTimeout(async () => {
      const list = await fetchSessions(true);
      const target = list.find((s) => s.name === sessionName);
      if (target && STUCK_STATUSES.includes(target.status)) {
        stopPolling();
        setStartingName('');
        message.warning({
          content: (
            <span>
              Session <b>{sessionName}</b> tampak stuck di <b>{target.status}</b>.
              Gunakan tombol <b>Force Restart</b> untuk reset.
            </span>
          ),
          duration: 8
        });
      }
    }, STUCK_TIMEOUT_MS);
  }, [fetchSessions, stopPolling]);

  // Cleanup saat unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── start session ────────────────────────────────────────────────────────
  const handleStartSession = async (values) => {
    const name = values.name?.trim() || 'default';
    setStartingName(name);
    try {
      await wahaAPI.startSession(name);
      createForm.resetFields();
      await fetchSessions(true);
      // Mulai polling untuk pantau transisi status
      startPolling(name);
    } catch (e) {
      setStartingName('');
      message.error(e.response?.data?.error?.message || 'Gagal memulai sesi');
    }
  };

  // ── force restart ────────────────────────────────────────────────────────
  const handleForceRestart = async (sessionName) => {
    Modal.confirm({
      title  : `Force Restart "${sessionName}"?`,
      icon   : <WarningOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p>Session akan di-<b>stop → hapus → buat ulang</b> dari nol.</p>
          <p>Kamu perlu <b>scan QR ulang</b> setelahnya.</p>
        </div>
      ),
      okText    : 'Ya, Restart',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setForceRestarting(sessionName);
        try {
          await wahaAPI.forceRestart(sessionName);
          message.success(`Session "${sessionName}" berhasil di-restart dari nol`);
          await fetchSessions(true);
          // Langsung polling supaya tau kapan butuh scan QR
          startPolling(sessionName);
        } catch (e) {
          message.error(e.response?.data?.error?.message || 'Force restart gagal');
        } finally {
          setForceRestarting('');
        }
      }
    });
  };

  // ── stop session ─────────────────────────────────────────────────────────
  const handleStop = async (sessionName) => {
    try {
      await wahaAPI.stopSession(sessionName);
      message.success(`Session "${sessionName}" dihentikan`);
      fetchSessions();
    } catch (e) {
      message.error('Gagal menghentikan sesi');
    }
  };

  // ── QR code ──────────────────────────────────────────────────────────────
  const handleShowQR = async (sessionName) => {
    setQrSession(sessionName);
    setQrLoading(true);
    setQrModalOpen(true);
    setQrData(null);
    try {
      const res = await wahaAPI.getQR(sessionName);
      setQrData(res.data?.data || res.data);
    } catch (e) {
      message.error('Gagal mengambil QR code: ' + (e.response?.data?.error?.message || e.message));
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  // ── send test message ────────────────────────────────────────────────────
  const handleSend = async (values) => {
    setSendLoading(true);
    try {
      const chatId = values.recipient.replace(/\D/g, '') + '@c.us';
      await wahaAPI.sendMessage({ session: values.session, recipient: chatId, content: values.content });
      message.success('Pesan terkirim!');
      sendForm.resetFields();
      setSendModalOpen(false);
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal mengirim pesan');
    } finally {
      setSendLoading(false);
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const isStuck    = (s) => STUCK_STATUSES.includes(s.status);
  const isRunning  = (s) => RUNNING_STATUSES.includes(s.status);
  const isStarting = (s) => s.status === 'STARTING' || s.name === startingName;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>WhatsApp Session</Title>
          <Text type="secondary">Kelola koneksi WhatsApp via WAHA</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchSessions()} loading={loading}>Refresh</Button>
          <Button icon={<SendOutlined />} onClick={() => setSendModalOpen(true)}>Test Kirim</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* ── Start new session ─────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card title="➕ Mulai Sesi Baru" style={{ borderRadius: 12 }}>
            <Form form={createForm} layout="vertical" onFinish={handleStartSession}>
              <Form.Item name="name" label="Nama Sesi" initialValue="default">
                <Input placeholder="default" />
              </Form.Item>
              <Button
                type="primary" htmlType="submit" block icon={<PlayCircleOutlined />}
                loading={!!startingName}
                style={{ background: '#25D366', borderColor: '#25D366' }}
              >
                {startingName ? 'Memulai...' : 'Mulai Sesi'}
              </Button>
            </Form>
            <Divider />
            <Alert
              type="info" showIcon
              message="Tips"
              description="Gunakan nama 'default' karena scheduler otomatis menggunakan sesi bernama 'default'."
            />
          </Card>
        </Col>

        {/* ── Active sessions ───────────────────────────── */}
        <Col xs={24} lg={16}>
          <Card
            title={`📱 Sesi Aktif (${sessions.length})`}
            style={{ borderRadius: 12 }}
            loading={loading}
          >
            {sessions.length === 0 ? (
              <Alert type="warning" showIcon
                message="Belum ada sesi WhatsApp"
                description="Buat sesi baru dan scan QR code untuk mulai mengirim pesan" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {sessions.map((session) => (
                  <Card
                    key={session.name} size="small"
                    style={{
                      borderRadius: 8,
                      border: `1px solid ${isRunning(session) ? '#b7eb8f' : isStuck(session) ? '#ffe58f' : '#e5e7eb'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space align="start">
                        <WhatsAppOutlined style={{ color: '#25D366', fontSize: 20, marginTop: 2 }} />
                        <div>
                          <Space>
                            <Text strong>{session.name}</Text>
                            {isStarting(session) && (
                              <LoadingOutlined style={{ color: '#1677ff' }} />
                            )}
                          </Space>
                          <br />
                          <Tag color={SESSION_COLOR[session.status] || 'default'} style={{ marginTop: 2 }}>
                            {SESSION_LABEL[session.status] || session.status}
                          </Tag>
                          {session.me?.pushname && (
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              {session.me.pushname}
                            </Text>
                          )}
                          {/* Warning stuck */}
                          {isStuck(session) && session.name !== startingName && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="warning" style={{ fontSize: 11 }}>
                                <WarningOutlined /> Session tampak stuck. Gunakan Force Restart.
                              </Text>
                            </div>
                          )}
                        </div>
                      </Space>

                      <Space wrap>
                        {/* QR button — tampil saat perlu scan atau sudah running */}
                        {(session.status === 'SCAN_QR_CODE' || isRunning(session)) && (
                          <Button
                            size="small"
                            icon={<QrcodeOutlined />}
                            onClick={() => handleShowQR(session.name)}
                            type={session.status === 'SCAN_QR_CODE' ? 'primary' : 'default'}
                          >
                            {session.status === 'SCAN_QR_CODE' ? 'Scan QR' : 'QR'}
                          </Button>
                        )}

                        {/* Force restart — tampil saat stuck */}
                        {isStuck(session) && (
                          <Tooltip title="Stop → hapus → buat ulang dari nol">
                            <Button
                              size="small"
                              icon={<ThunderboltOutlined />}
                              danger
                              loading={forceRestarting === session.name}
                              onClick={() => handleForceRestart(session.name)}
                            >
                              Force Restart
                            </Button>
                          </Tooltip>
                        )}

                        {/* Stop button */}
                        {!isStarting(session) && (
                          <Button
                            size="small" danger icon={<StopOutlined />}
                            onClick={() => handleStop(session.name)}
                          >
                            Stop
                          </Button>
                        )}
                      </Space>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── QR Modal ──────────────────────────────────────────────────────── */}
      <Modal
        title={`QR Code — Sesi "${qrSession}"`}
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="refresh" onClick={() => handleShowQR(qrSession)} icon={<ReloadOutlined />}>
            Refresh QR
          </Button>
        ]}
        width={360}
      >
        {qrLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <br /><Text type="secondary" style={{ marginTop: 12, display: 'block' }}>Memuat QR Code...</Text>
          </div>
        ) : qrData ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            {qrData.imageBase64 ? (
              <img src={qrData.imageBase64} alt="QR Code" style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : (
              <pre style={{ fontSize: 10, textAlign: 'left' }}>{JSON.stringify(qrData, null, 2)}</pre>
            )}
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
              Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR
            </Text>
          </div>
        ) : null}
      </Modal>

      {/* ── Test Send Modal ───────────────────────────────────────────────── */}
      <Modal
        title="Test Kirim Pesan"
        open={sendModalOpen}
        onCancel={() => setSendModalOpen(false)}
        footer={null}
      >
        <Form form={sendForm} layout="vertical" onFinish={handleSend} style={{ marginTop: 16 }}>
          <Form.Item name="session" label="Nama Sesi" initialValue="default" rules={[{ required: true }]}>
            <Input placeholder="default" />
          </Form.Item>
          <Form.Item name="recipient" label="Nomor Tujuan" rules={[{ required: true }]}>
            <Input placeholder="628123456789" />
          </Form.Item>
          <Form.Item name="content" label="Pesan" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Tulis pesan..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSendModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={sendLoading}
                style={{ background: '#25D366', borderColor: '#25D366' }}>
                Kirim
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
