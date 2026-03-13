import { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Space, Typography, Alert, Row, Col,
  Form, Input, Modal, Descriptions, Image, Spin, message, Divider
} from 'antd';
import {
  WhatsAppOutlined, PlayCircleOutlined, StopOutlined,
  QrcodeOutlined, ReloadOutlined, SendOutlined
} from '@ant-design/icons';
import { wahaAPI } from '../api';

const { Title, Text } = Typography;

const SESSION_COLOR = {
  WORKING: 'green', CONNECTED: 'green',
  SCAN_QR_CODE: 'orange', STARTING: 'blue',
  STOPPED: 'default', FAILED: 'red'
};

export default function Whatsapp() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSession, setQrSession] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [sendForm] = Form.useForm();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await wahaAPI.getSessions();
      setSessions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      message.error('Gagal memuat sesi WhatsApp: ' + (e.response?.data?.error?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleStartSession = async (values) => {
    try {
      await wahaAPI.startSession(values.name || 'default');
      message.success('Sesi dimulai! Scan QR code untuk terhubung');
      createForm.resetFields();
      fetchSessions();
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal memulai sesi');
    }
  };

  const handleShowQR = async (sessionName) => {
    setQrSession(sessionName);
    setQrLoading(true);
    setQrModalOpen(true);
    setQrData(null);
    try {
      const res = await wahaAPI.getQR(sessionName);
      setQrData(res.data?.data || res.data);
    } catch (e) {
      message.error('Gagal mengambil QR code');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleStop = async (sessionName) => {
    try {
      await wahaAPI.stopSession(sessionName);
      message.success('Sesi dihentikan');
      fetchSessions();
    } catch (e) {
      message.error('Gagal menghentikan sesi');
    }
  };

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>WhatsApp Session</Title>
          <Text type="secondary">Kelola koneksi WhatsApp via WAHA</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSessions} loading={loading}>Refresh</Button>
          <Button icon={<SendOutlined />} onClick={() => setSendModalOpen(true)}>Test Kirim</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Start New Session */}
        <Col xs={24} lg={8}>
          <Card title="➕ Mulai Sesi Baru" style={{ borderRadius: 12 }}>
            <Form form={createForm} layout="vertical" onFinish={handleStartSession}>
              <Form.Item name="name" label="Nama Sesi" initialValue="default">
                <Input placeholder="default" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block icon={<PlayCircleOutlined />}
                style={{ background: '#25D366', borderColor: '#25D366' }}>
                Mulai Sesi
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

        {/* Active Sessions */}
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
                {sessions.map(session => (
                  <Card key={session.name} size="small"
                    style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <WhatsAppOutlined style={{ color: '#25D366', fontSize: 18 }} />
                        <div>
                          <Text strong>{session.name}</Text>
                          <br />
                          <Tag color={SESSION_COLOR[session.status] || 'default'} style={{ marginTop: 2 }}>
                            {session.status}
                          </Tag>
                          {session.me?.pushname && (
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              ({session.me.pushname})
                            </Text>
                          )}
                        </div>
                      </Space>
                      <Space>
                        {session.status === 'SCAN_QR_CODE' && (
                          <Button size="small" icon={<QrcodeOutlined />}
                            onClick={() => handleShowQR(session.name)} type="primary">
                            Scan QR
                          </Button>
                        )}
                        {session.status === 'WORKING' && (
                          <Button size="small" icon={<QrcodeOutlined />}
                            onClick={() => handleShowQR(session.name)}>
                            QR
                          </Button>
                        )}
                        <Button size="small" danger icon={<StopOutlined />}
                          onClick={() => handleStop(session.name)}>
                          Stop
                        </Button>
                      </Space>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* QR Modal */}
      <Modal
        title={`QR Code - Sesi "${qrSession}"`}
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
            <br /><Text type="secondary">Memuat QR Code...</Text>
          </div>
        ) : qrData ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            {qrData.imageBase64 ? (
              <img src={qrData.imageBase64} alt="QR Code" style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : qrData.qr ? (
              <Text style={{ fontFamily: 'monospace', fontSize: 10 }}>{qrData.qr}</Text>
            ) : (
              <pre style={{ fontSize: 10, textAlign: 'left' }}>{JSON.stringify(qrData, null, 2)}</pre>
            )}
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Buka WhatsApp → Settings → Linked Devices → Scan QR
            </Text>
          </div>
        ) : null}
      </Modal>

      {/* Send Test Message Modal */}
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
