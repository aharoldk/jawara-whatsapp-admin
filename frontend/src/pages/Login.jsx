import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useLogin } from './hooks/useLogin';
import { getSubdomain } from '../utils/tenant';

const { Text } = Typography;

export default function Login() {
  const { loading, error, handleLogin } = useLogin();
  const subdomain = getSubdomain();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#f5f6fa'
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fff',
        borderRadius: 16, padding: '40px 40px 36px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.07)'
      }}>
        {/* Subdomain badge */}
        {subdomain && subdomain !== 'dev' && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '6px 12px', marginBottom: 20,
            textAlign: 'center'
          }}>
            <Text style={{ fontSize: 13, color: '#16a34a' }}>
              🏪 <strong>{subdomain}</strong>.jawara.com
            </Text>
          </div>
        )}

        {error && (
          <Alert message={error} type="error" showIcon
            style={{ marginBottom: 20, borderRadius: 8 }} />
        )}

        <Form onFinish={handleLogin} layout="vertical" size="large" requiredMark={false}>
          <Form.Item name="email" label={<Text style={{ fontWeight: 500 }}>Email</Text>}
            rules={[
              { required: true, message: 'Email wajib diisi' },
              { type: 'email', message: 'Format email tidak valid' }
            ]}>
            <Input prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
              placeholder="email@bisnis.com" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="password" label={<Text style={{ fontWeight: 500 }}>Password</Text>}
            rules={[{ required: true, message: 'Password wajib diisi' }]}
            style={{ marginBottom: 24 }}>
            <Input.Password prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Masukkan password" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{
              height: 44, fontSize: 15, fontWeight: 600,
              borderRadius: 8, background: '#16a34a', borderColor: '#16a34a'
            }}>
            Masuk
          </Button>
        </Form>

        <Divider style={{ margin: '24px 0 16px' }} />


        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 16 }}>
          Jawara WhatsApp Admin v1.0
        </Text>
      </div>
    </div>
  );
}
