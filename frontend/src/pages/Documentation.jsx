import { useState } from 'react';
import { Row, Col, Card, Typography, Space, Tag, Tabs, Collapse, Alert, Divider, Steps, Table } from 'antd';
import {
  BookOutlined, CodeOutlined, QuestionCircleOutlined,
  CheckCircleOutlined, WarningOutlined, InfoCircleOutlined,
  WhatsAppOutlined, TeamOutlined, NotificationOutlined, ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Reusable code block
function CodeBlock({ children, label }) {
  return (
    <div style={{ marginTop: label ? 8 : 0 }}>
      {label && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>}
      <div style={{
        background: '#1e1e2e',
        borderRadius: 8,
        padding: '12px 16px',
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#cdd6f4',
        overflowX: 'auto',
        lineHeight: 1.6
      }}>
        {typeof children === 'string'
          ? children.split('\n').map((line, i) => (
            <div key={i} style={{ color: line.startsWith('#') ? '#6c7086' : '#cdd6f4' }}>{line || '\u00A0'}</div>
          ))
          : children}
      </div>
    </div>
  );
}

function Badge({ children, color }) {
  const colors = {
    blue:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    green:  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    orange: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    purple: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
    gray:   { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 4,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontFamily: 'monospace', fontSize: 12
    }}>
      {children}
    </span>
  );
}

// Template variables table data
const templateVars = [
  { variable: '{{fullName}}', description: 'Nama lengkap customer', example: 'Budi Santoso', category: 'Customer' },
  { variable: '{{whatsappNumber}}', description: 'Nomor WhatsApp customer', example: '628123456789', category: 'Customer' },
  { variable: '{{address}}', description: 'Alamat customer', example: 'Jl. Merdeka No. 1', category: 'Customer' },
  { variable: '{{tags}}', description: 'Tag customer (array, dipisah koma)', example: 'vip, premium', category: 'Customer' },
  { variable: '{{data.lastServiceDate}}', description: 'Tanggal service terakhir (custom field)', example: '2024-01-15', category: 'Custom Data' },
  { variable: '{{data.lastOrder}}', description: 'Pesanan terakhir (custom field)', example: 'Nasi Goreng x2', category: 'Custom Data' },
  { variable: '{{data.vehicle}}', description: 'Kendaraan (custom field)', example: 'Toyota Avanza B 1234 AB', category: 'Custom Data' },
  { variable: '{{data.npwp}}', description: 'NPWP (custom field)', example: '12.345.678.9-000.000', category: 'Custom Data' },
  { variable: '{{data.birthDate}}', description: 'Tanggal lahir (custom field)', example: '1990-05-20', category: 'Custom Data' },
  { variable: '{{daysElapsed}}', description: 'Hari sejak lastServiceDate', example: '30', category: 'Computed' },
];

const templateColumns = [
  {
    title: 'Variabel',
    dataIndex: 'variable',
    key: 'variable',
    render: (v) => <Badge color="blue">{v}</Badge>,
  },
  {
    title: 'Deskripsi',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Contoh Nilai',
    dataIndex: 'example',
    key: 'example',
    render: (v) => <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
  },
  {
    title: 'Kategori',
    dataIndex: 'category',
    key: 'category',
    render: (v) => {
      const colorMap = { Customer: 'green', 'Custom Data': 'blue', Computed: 'orange' };
      return <Tag color={colorMap[v] || 'default'}>{v}</Tag>;
    }
  },
];

// FAQ items
const faqItems = [
  {
    key: '1',
    label: 'QR Code tidak muncul atau expired?',
    children: (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>QR code WAHA memiliki masa berlaku sekitar 20-60 detik. Beberapa solusi:</Text>
        <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
          <li>Klik tombol <strong>Refresh QR</strong> di modal untuk mendapatkan QR baru</li>
          <li>QR otomatis diperbarui setiap 30 detik selama modal terbuka</li>
          <li>Pastikan sesi dalam status <Tag color="warning">SCAN_QR_CODE</Tag></li>
          <li>Jika sesi dalam status FAILED, stop dan buat sesi baru</li>
        </ul>
      </Space>
    )
  },
  {
    key: '2',
    label: 'Pesan tidak terkirim ke customer?',
    children: (
      <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
        <li>Pastikan sesi WhatsApp dalam status <Tag color="success">WORKING</Tag></li>
        <li>Pastikan nomor customer diawali kode negara (628xxx, bukan 08xxx)</li>
        <li>Cek log service untuk error detail</li>
        <li>Pastikan scheduler/reminder service aktif (<code>SCHEDULER_ENABLED=true</code>)</li>
        <li>Jika koneksi WAHA gagal, restart container WAHA</li>
      </ul>
    )
  },
  {
    key: '3',
    label: 'Template tidak merender variabel (tampil {{fullName}} mentah)?',
    children: (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>Ini biasanya karena:</Text>
        <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
          <li>Nama field customer tidak sesuai (case-sensitive)</li>
          <li>Field <code>data.*</code> harus diisi di menu Customer → Edit → Custom Data</li>
          <li>Pastikan sintaks Mustache benar: dua kurung kurawal <code>{'{{'}variabel{'}}'}</code></li>
        </ul>
      </Space>
    )
  }
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Documentation() {
  const tabItems = [
    {
      key: 'quickstart',
      label: <Space><CheckCircleOutlined />Quick Start</Space>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card style={{ borderRadius: 12, body: { padding: 0 } }}>
              <Steps
                direction="vertical"
                current={-1}
                items={[
                  {
                    title: <Text strong>1. Hubungkan WhatsApp</Text>,
                    description: (
                      <div style={{ marginTop: 8 }}>
                        <ol style={{ paddingLeft: 20, lineHeight: 2.2, margin: 0 }}>
                          <li>Buka <strong>Dashboard</strong> → panel <em>Koneksi WhatsApp</em></li>
                          <li>Klik <strong>Mulai Sesi</strong></li>
                          <li>Tunggu status berubah menjadi <Tag color="warning">Perlu Scan QR</Tag></li>
                          <li>Klik <strong>Scan QR</strong> dan scan dari HP kamu</li>
                          <li>Status berubah menjadi <Tag color="success">Terhubung</Tag> ✅</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    title: <Text strong>2. Tambah Customer</Text>,
                    description: (
                      <div style={{ marginTop: 8 }}>
                        <Text>Buka menu <strong>Customer</strong> → Tambah Customer. Isi:</Text>
                        <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 4 }}>
                          <li>Nama lengkap</li>
                          <li>Nomor WhatsApp (format: <Badge color="blue">628123456789</Badge>)</li>
                          <li>Custom data (opsional: lastServiceDate, kendaraan, dll)</li>
                        </ul>
                      </div>
                    ),
                  },
                  {
                    title: <Text strong>3. Buat & Jadwalkan Promosi / Reminder</Text>,
                    description: (
                      <div style={{ marginTop: 8 }}>
                        <Text>
                          Gunakan menu <strong>Promosi</strong> atau <strong>Reminder</strong>.
                          Tulis pesan dengan variabel template Mustache untuk personalisasi.
                        </Text>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      ),
    },

    {
      key: 'templates',
      label: <Space><CodeOutlined />Template</Space>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={<Space><CodeOutlined />Variabel Template Mustache</Space>}
              style={{ borderRadius: 12 }}
            >
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Gunakan variabel berikut di body pesan promosi dan reminder.
                Field <Tag color="blue">Custom Data</Tag> harus diisi manual di masing-masing customer.
              </Paragraph>
              <Table
                dataSource={templateVars}
                columns={templateColumns}
                pagination={false}
                size="small"
                rowKey="variable"
                style={{ borderRadius: 8 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Contoh Template Servis Kendaraan"
              style={{ borderRadius: 12 }}
            >
              <CodeBlock>
                {`Halo {{fullName}} 👋

Kami ingin mengingatkan bahwa kendaraan Anda
*{{data.vehicle}}* sudah {{daysElapsed}} hari
sejak servis terakhir ({{data.lastServiceDate}}).

Sudah waktunya servis! 🔧
Hubungi kami untuk jadwalkan:
📞 0812-3456-7890

Terima kasih,
Bengkel Maju Jaya`}
              </CodeBlock>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Contoh Template Promosi Bulanan"
              style={{ borderRadius: 12 }}
            >
              <CodeBlock>
                {`Halo {{fullName}}! 🎉

*PROMO SPESIAL BULAN INI* untuk pelanggan setia kami!

Diskon *20%* untuk semua layanan servis!
Berlaku hingga akhir bulan ini.

Tunjukkan pesan ini saat datang ke bengkel.
📍 {{address}}

Salam,
Tim Promo Bengkel Maju Jaya`}
              </CodeBlock>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title={<Space><InfoCircleOutlined />Cara Menambah Custom Data</Space>}
              style={{ borderRadius: 12 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Steps
                    size="small"
                    direction="vertical"
                    current={-1}
                    items={[
                      { title: 'Buka menu Customer' },
                      { title: 'Klik Edit pada customer' },
                      { title: 'Scroll ke bagian Custom Data' },
                      { title: 'Tambah key-value pair sesuai kebutuhan' },
                      { title: 'Simpan — variabel {{data.namaField}} siap dipakai' },
                    ]}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                    Contoh JSON Custom Data:
                  </Text>
                  <CodeBlock>
                    {`{
  "lastServiceDate": "2024-11-15",
  "vehicle": "Honda Vario B 5678 XY",
  "mileage": "45000",
  "package": "Gold Member"
}`}
                  </CodeBlock>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },

    {
      key: 'faq',
      label: <Space><QuestionCircleOutlined />FAQ & Troubleshooting</Space>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card style={{ borderRadius: 12 }}>
              <Collapse
                items={faqItems}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Dokumentasi</Title>
        <Text type="secondary">Panduan penggunaan Jawara WhatsApp Admin</Text>
      </div>

      <Tabs items={tabItems} size="middle" />
    </div>
  );
}
