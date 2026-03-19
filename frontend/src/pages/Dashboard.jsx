import {
  Row, Col, Card, Statistic, Typography, Space, Tag,
  Button, Form, Input, Modal, Spin, Alert, Badge
} from 'antd';
import {
  TeamOutlined, NotificationOutlined, ClockCircleOutlined,
  WhatsAppOutlined, PlayCircleOutlined, StopOutlined,
  QrcodeOutlined, ReloadOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SendOutlined
} from '@ant-design/icons';
import { useDashboard } from './hooks/useDashboard';
import { SESSION_COLOR, SESSION_LABEL } from '../constants';

const { Title, Text } = Typography;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }) {
  return (
    <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic
          title={title}
          value={value}
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

function SessionItem({ session, onShowQR, onStop }) {
  const isWorking = session.status === 'WORKING' || session.status === 'CONNECTED';
  const needsQR   = session.status === 'SCAN_QR_CODE';

  return (
    <div style={{
      border      : `1px solid ${isWorking ? '#bbf7d0' : needsQR ? '#fed7aa' : '#e5e7eb'}`,
      borderRadius: 10,
      padding     : '12px 16px',
      background  : isWorking ? '#f0fdf4' : needsQR ? '#fff7ed' : '#fafafa',
      display     : 'flex',
      justifyContent: 'space-between',
      alignItems  : 'center',
      flexWrap    : 'wrap',
      gap         : 8
    }}>
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
              <Text type="secondary" style={{ fontSize: 12 }}>· {session.me.pushname}</Text>
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
            type="primary" size="small" icon={<QrcodeOutlined />}
            onClick={() => onShowQR(session.name)}
            style={{ background: '#d97706', borderColor: '#d97706' }}
          >
            Scan QR
          </Button>
        )}
        {isWorking && (
          <Button size="small" icon={<QrcodeOutlined />} onClick={() => onShowQR(session.name)}>
            QR
          </Button>
        )}
        <Button size="small" danger icon={<StopOutlined />} onClick={() => onStop(session.name)}>
          Stop
        </Button>
      </Space>
    </div>
  );
}

function QRContent({ qrLoading, qrData }) {
  if (qrLoading) return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <Spin size="large" />
      <br /><br />
      <Text type="secondary">Memuat QR Code...</Text>
    </div>
  );

  if (!qrData) return null;

  const imageSrc = typeof qrData === 'string' && qrData.startsWith('data:')
    ? qrData
    : qrData?.imageBase64 || qrData?.image || null;

  return (
    <div style={{ textAlign: 'center', padding: 8 }}>
      {imageSrc ? (
        <img src={imageSrc} alt="QR Code" style={{ maxWidth: 260, width: '100%', borderRadius: 8 }} />
      ) : qrData?.qr ? (
        <div style={{
          background: '#fff', padding: 16, borderRadius: 8,
          border: '1px solid #e5e7eb', fontFamily: 'monospace',
          fontSize: 9, lineHeight: 1.2, wordBreak: 'break-all'
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
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    stats, statsLoading,
    sessions, sessionsLoading, startLoading,
    hasConnected, hasPendingQR, connectedSessions,
    fetchSessions, handleStartSession, handleStop,
    qrModalOpen, qrData, qrLoading, qrSession,
    handleShowQR, handleCloseQR, fetchQR,
    sendModalOpen, sendLoading,
    openSendModal, closeSendModal, handleSend,
    createForm, sendForm,
  } = useDashboard();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Selamat datang di Jawara WA Admin</Text>
      </div>

      {/* ── WhatsApp Session Panel ──────────────────────────────────────────── */}
      <Card
        style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb', body: { padding: 0 } }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 8
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
            <Button size="small" icon={<ReloadOutlined />} onClick={() => fetchSessions()} loading={sessionsLoading}>
              Refresh
            </Button>
            {hasConnected && (
              <Button size="small" icon={<SendOutlined />} onClick={openSendModal}>
                Test Kirim Pesan
              </Button>
            )}
          </Space>
        </div>

        <div style={{ padding: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{
                border: '1px dashed #d1d5db', borderRadius: 10,
                padding: '20px 16px', height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>➕ Mulai Sesi Baru</Text>
                <Form form={createForm} onFinish={handleStartSession}>
                  <Button
                    type="primary" htmlType="submit" block
                    icon={<PlayCircleOutlined />} loading={startLoading}
                    style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 6 }}
                  >
                    Mulai Sesi
                  </Button>
                </Form>
              </div>
            </Col>

            <Col xs={24} md={16}>
              {sessionsLoading && sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : sessions.length === 0 ? (
                <Alert
                  type="info" showIcon icon={<WhatsAppOutlined />}
                  message="Belum ada sesi WhatsApp"
                  description="Mulai sesi baru di panel kiri, tunggu sebentar, lalu scan QR code."
                  style={{ borderRadius: 10 }}
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {sessions.map((session) => (
                    <SessionItem
                      key={session.name}
                      session={session}
                      onShowQR={handleShowQR}
                      onStop={handleStop}
                    />
                  ))}
                </Space>
              )}
            </Col>
          </Row>
        </div>
      </Card>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard title="Total Customer" value={statsLoading ? '-' : stats.customers} icon={<TeamOutlined />} color="#16a34a" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Total Promosi" value={statsLoading ? '-' : stats.promotions} icon={<NotificationOutlined />} color="#3B82F6" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Total Reminder" value={statsLoading ? '-' : stats.reminders} icon={<ClockCircleOutlined />} color="#8B5CF6" />
        </Col>
      </Row>

      {/* ── QR Modal ────────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><QrcodeOutlined /><span>QR Code — Sesi "{qrSession}"</span></Space>}
        open={qrModalOpen}
        onCancel={handleCloseQR}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => fetchQR(qrSession)} loading={qrLoading}>
            Refresh QR
          </Button>,
          <Button key="close" onClick={handleCloseQR}>Tutup</Button>
        ]}
        width={360}
        destroyOnHidden
      >
        <QRContent qrLoading={qrLoading} qrData={qrData} />
      </Modal>

      {/* ── Send Test Modal ──────────────────────────────────────────────────── */}
      <Modal
        title={<Space><SendOutlined /><span>Test Kirim Pesan</span></Space>}
        open={sendModalOpen}
        onCancel={closeSendModal}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={sendForm} layout="vertical" onFinish={handleSend}
          style={{ marginTop: 16 }}
          initialValues={{ session: connectedSessions[0]?.name || 'default' }}
        >
          <Form.Item
            name="recipient" label="Nomor Tujuan"
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
              <Button onClick={closeSendModal}>Batal</Button>
              <Button
                type="primary" htmlType="submit" loading={sendLoading}
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