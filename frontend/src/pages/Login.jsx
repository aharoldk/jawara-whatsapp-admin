import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { MailOutlined, LockOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #075E54 0%, #128C7E 50%, #25D366 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        bodyStyle={{ padding: 40 }}
      >
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366, #075E54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto'
          }}>
            <WhatsAppOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#111827' }}>Jawara WA Admin</Title>
          <Text type="secondary">Masuk ke dashboard admin</Text>
        </Space>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}

        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: 'Email wajib diisi' }, { type: 'email', message: 'Format email tidak valid' }]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Password wajib diisi' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary" htmlType="submit" block loading={loading}
              style={{ height: 48, fontSize: 15, background: '#25D366', borderColor: '#25D366' }}
            >
              Masuk
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
