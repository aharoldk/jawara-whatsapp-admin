import { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Steps, Select, Divider } from 'antd';
import {
  ShopOutlined, UserOutlined, MailOutlined,
  LockOutlined, LinkOutlined, ArrowRightOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const BUSINESS_TYPES = [
  'Bengkel Motor', 'Bengkel Mobil', 'Laundry', 'Toko Sembako',
  'Restoran / Warung', 'Salon & Barbershop', 'Klinik / Apotek',
  'Toko Online', 'Jasa Lainnya'
];

const CARD = {
  width: '100%', maxWidth: 480, background: '#fff',
  borderRadius: 16, padding: '40px 40px 36px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.07)'
};

export default function Register() {
  const [form]    = Form.useForm();
  const navigate  = useNavigate();
  const [step,    setStep]    = useState(0); // 0=bisnis, 1=akun, 2=selesai
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [allData, setAllData] = useState({});

  // Validasi subdomain live
  const [subdomain, setSubdomain] = useState('');

  const handleStep0 = async () => {
    try {
      const values = await form.validateFields(['tenantName', 'subdomain', 'businessType']);
      setAllData(prev => ({ ...prev, ...values }));
      setStep(1);
    } catch {}
  };

  const handleStep1 = async () => {
    try {
      const values = await form.validateFields(['ownerName', 'email', 'password', 'confirmPassword']);
      if (values.password !== values.confirmPassword) {
        form.setFields([{ name: 'confirmPassword', errors: ['Password tidak cocok'] }]);
        return;
      }
      setLoading(true);
      setError('');
      const payload = { ...allData, ...values };
      delete payload.confirmPassword;

      await authAPI.registerTenant(payload);
      setStep(2);
    } catch (e) {
      if (e?.response) {
        setError(e.response.data?.error?.message || 'Pendaftaran gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = subdomain
    ? `${subdomain}.jawara.com`
    : 'nama-bisnis.jawara.com';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#f5f6fa'
    }}>
      <div style={CARD}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#16a34a', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12
          }}>
            <ShopOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>Daftar Bisnis Baru</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Jawara WhatsApp Admin
          </Text>
        </div>

        {/* Steps indicator */}
        {step < 2 && (
          <Steps
            current={step} size="small" style={{ marginBottom: 28 }}
            items={[
              { title: 'Info Bisnis' },
              { title: 'Akun Owner' }
            ]}
          />
        )}

        {error && (
          <Alert message={error} type="error" showIcon
            style={{ marginBottom: 20, borderRadius: 8 }} closable onClose={() => setError('')} />
        )}

        <Form form={form} layout="vertical" size="large" requiredMark={false}>

          {/* ── Step 0: Info Bisnis ────────────────────────────────── */}
          {step === 0 && (
            <>
              <Form.Item name="tenantName" label={<Text style={{ fontWeight: 500 }}>Nama Bisnis</Text>}
                rules={[{ required: true, message: 'Nama bisnis wajib diisi' }]}>
                <Input prefix={<ShopOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Bengkel Jaya Motor" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item name="businessType" label={<Text style={{ fontWeight: 500 }}>Jenis Bisnis</Text>}>
                <Select placeholder="Pilih jenis bisnis" style={{ borderRadius: 8 }}>
                  {BUSINESS_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>

              <Form.Item
                name="subdomain"
                label={<Text style={{ fontWeight: 500 }}>Subdomain</Text>}
                extra={
                  <span style={{ fontSize: 12, color: '#16a34a' }}>
                    URL kamu: <strong>{previewUrl}</strong>
                  </span>
                }
                rules={[
                  { required: true, message: 'Subdomain wajib diisi' },
                  { pattern: /^[a-z0-9-]+$/, message: 'Hanya huruf kecil, angka, dan tanda hubung' },
                  { min: 3, message: 'Minimal 3 karakter' }
                ]}
              >
                <Input
                  prefix={<LinkOutlined style={{ color: '#9ca3af' }} />}
                  suffix={<Text type="secondary" style={{ fontSize: 12 }}>.jawara.com</Text>}
                  placeholder="bengkel-jaya"
                  style={{ borderRadius: 8 }}
                  onChange={e => setSubdomain(e.target.value.toLowerCase())}
                  onInput={e => { e.target.value = e.target.value.toLowerCase(); }}
                />
              </Form.Item>

              <Button type="primary" block onClick={handleStep0}
                icon={<ArrowRightOutlined />} iconPosition="end"
                style={{ height: 44, borderRadius: 8, background: '#16a34a', borderColor: '#16a34a', marginTop: 4 }}>
                Lanjut
              </Button>
            </>
          )}

          {/* ── Step 1: Akun Owner ─────────────────────────────────── */}
          {step === 1 && (
            <>
              <Form.Item name="ownerName" label={<Text style={{ fontWeight: 500 }}>Nama Pemilik</Text>}
                rules={[{ required: true, message: 'Nama pemilik wajib diisi' }]}>
                <Input prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Budi Santoso" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item name="email" label={<Text style={{ fontWeight: 500 }}>Email</Text>}
                rules={[
                  { required: true, message: 'Email wajib diisi' },
                  { type: 'email', message: 'Format email tidak valid' }
                ]}>
                <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="owner@bisnis.com" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item name="password" label={<Text style={{ fontWeight: 500 }}>Password</Text>}
                rules={[
                  { required: true, message: 'Password wajib diisi' },
                  { min: 6, message: 'Minimal 6 karakter' }
                ]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Minimal 6 karakter" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Form.Item name="confirmPassword" label={<Text style={{ fontWeight: 500 }}>Konfirmasi Password</Text>}
                rules={[{ required: true, message: 'Konfirmasi password wajib diisi' }]}
                style={{ marginBottom: 24 }}>
                <Input.Password prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                  placeholder="Ulangi password" style={{ borderRadius: 8 }} />
              </Form.Item>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button block onClick={() => setStep(0)} style={{ height: 44, borderRadius: 8 }}>
                  Kembali
                </Button>
                <Button type="primary" block loading={loading} onClick={handleStep1}
                  style={{ height: 44, borderRadius: 8, background: '#16a34a', borderColor: '#16a34a' }}>
                  Daftar Sekarang
                </Button>
              </div>
            </>
          )}

          {/* ── Step 2: Selesai ────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <CheckCircleOutlined style={{ fontSize: 56, color: '#16a34a', marginBottom: 16 }} />
              <Title level={4} style={{ margin: '0 0 8px' }}>Pendaftaran Berhasil!</Title>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Bisnis kamu sudah terdaftar. Akses panel admin melalui:
              </Paragraph>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '12px 16px', marginBottom: 24
              }}>
                <Text strong style={{ color: '#16a34a', fontSize: 15 }}>
                  {allData.subdomain}.jawara.com
                </Text>
              </div>
              <Button type="primary" block onClick={() => navigate('/login')}
                style={{ height: 44, borderRadius: 8, background: '#16a34a', borderColor: '#16a34a' }}>
                Masuk Sekarang
              </Button>
            </div>
          )}
        </Form>

        {step < 2 && (
          <>
            <Divider style={{ margin: '24px 0 16px' }} />
            <Text type="secondary" style={{ fontSize: 13, display: 'block', textAlign: 'center' }}>
              Sudah punya akun?{' '}
              <Link to="/login" style={{ color: '#16a34a', fontWeight: 500 }}>Masuk di sini</Link>
            </Text>
          </>
        )}
      </div>
    </div>
  );
}
