import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Tag, Alert } from 'antd';
import {
  TeamOutlined, NotificationOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WhatsAppOutlined, SyncOutlined
} from '@ant-design/icons';
import { customersAPI, promotionsAPI, remindersAPI, wahaAPI } from '../api';

const { Title, Text } = Typography;

function StatCard({ title, value, icon, color, suffix }) {
  return (
    <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic title={title} value={value} suffix={suffix}
          valueStyle={{ color, fontWeight: 700, fontSize: 28 }} />
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
  const [stats, setStats] = useState({
    customers: 0, promotions: 0, pendingPromotions: 0,
    reminders: 0, activeReminders: 0
  });
  const [waStatus, setWaStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cust, promo, rem, wa] = await Promise.allSettled([
          customersAPI.getAll({ limit: 1 }),
          promotionsAPI.getAll({ limit: 1 }),
          remindersAPI.getAll({ limit: 1 }),
          wahaAPI.getSessions()
        ]);

        setStats({
          customers: cust.value?.data?.pagination?.total ?? 0,
          promotions: promo.value?.data?.pagination?.total ?? 0,
          pendingPromotions: 0,
          reminders: rem.value?.data?.pagination?.total ?? 0,
          activeReminders: 0
        });

        if (wa.status === 'fulfilled') {
          setWaStatus(Array.isArray(wa.value?.data?.data) ? wa.value.data.data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sessionStatus = waStatus[0]?.status || 'unknown';
  const isConnected = sessionStatus === 'WORKING' || sessionStatus === 'CONNECTED';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Selamat datang di Jawara WA Admin</Text>
      </div>

      {/* WA Connection Status */}
      <Alert
        style={{ marginBottom: 24, borderRadius: 10 }}
        type={isConnected ? 'success' : 'warning'}
        showIcon
        icon={<WhatsAppOutlined />}
        message={
          <span>
            Status WhatsApp:{' '}
            <Tag color={isConnected ? 'green' : 'orange'}>
              {sessionStatus === 'WORKING' ? '✅ Terhubung' : sessionStatus === 'SCAN_QR_CODE' ? '📷 Scan QR' : '⚠️ ' + sessionStatus}
            </Tag>
            {!isConnected && <Text type="secondary"> — Pergi ke menu WhatsApp untuk menghubungkan</Text>}
          </span>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Customer" value={stats.customers} icon={<TeamOutlined />} color="#25D366" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Promosi" value={stats.promotions} icon={<NotificationOutlined />} color="#3B82F6" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Reminder" value={stats.reminders} icon={<ClockCircleOutlined />} color="#8B5CF6" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Session WA"
            value={waStatus.length}
            suffix="aktif"
            icon={<WhatsAppOutlined />}
            color="#075E54"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="💡 Cara Penggunaan" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>1. Hubungkan WhatsApp</Text>
                <br />
                <Text type="secondary">Buka menu WhatsApp, start session, lalu scan QR code</Text>
              </div>
              <div>
                <Text strong>2. Import Customer</Text>
                <br />
                <Text type="secondary">Tambahkan customer beserta nomor WhatsApp dan data mereka</Text>
              </div>
              <div>
                <Text strong>3. Buat Promosi atau Reminder</Text>
                <br />
                <Text type="secondary">Gunakan template Mustache: <code>{'{{fullName}}'}</code>, <code>{'{{data.lastServiceDate}}'}</code></Text>
              </div>
              <div>
                <Text strong>4. Jadwalkan Pengiriman</Text>
                <br />
                <Text type="secondary">Scheduler otomatis berjalan setiap menit dan mengirim pesan tepat waktu</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="📝 Template Mustache" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">Variabel yang tersedia di template:</Text>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12 }}>
                {['{{fullName}}', '{{whatsappNumber}}', '{{address}}', '{{data.lastServiceDate}}', '{{data.lastOrder}}', '{{data.vehicle}}', '{{data.npwp}}', '{{daysElapsed}}'].map(v => (
                  <div key={v} style={{ marginBottom: 4 }}>
                    <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag>
                  </div>
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Contoh: <em>Halo {'{{fullName}}'}, service terakhir {'{{data.lastServiceDate}}'}</em>
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
