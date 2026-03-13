import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, Space } from 'antd';
import {
  DashboardOutlined, UserOutlined, TeamOutlined,
  NotificationOutlined, ClockCircleOutlined,
  WhatsAppOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAuth } from '../store/auth';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/',          icon: <DashboardOutlined />,    label: 'Dashboard' },
  { key: '/customers', icon: <TeamOutlined />,          label: 'Customer' },
  { key: '/promotions',icon: <NotificationOutlined />,  label: 'Promosi' },
  { key: '/reminders', icon: <ClockCircleOutlined />,   label: 'Reminder' },
  { key: '/whatsapp',  icon: <WhatsAppOutlined />,      label: 'WhatsApp' },
  { key: '/users',     icon: <UserOutlined />,           label: 'Pengguna' }
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', danger: true }
    ],
    onClick: ({ key }) => { if (key === 'logout') { logout(); navigate('/login'); } }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 10
        }}>
          <WhatsAppOutlined style={{ fontSize: 24, color: '#25D366' }} />
          {!collapsed && (
            <Text strong style={{ color: 'white', fontSize: 15 }}>Jawara WA</Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 100
        }}>
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18, color: '#374151' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: '#128C7E' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Text strong style={{ fontSize: 13 }}>{user?.name}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
