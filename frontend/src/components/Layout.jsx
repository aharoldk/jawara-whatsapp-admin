import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  DashboardOutlined, UserOutlined, TeamOutlined,
  NotificationOutlined, ClockCircleOutlined,
  WhatsAppOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useAuth } from '../store/auth';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/',             icon: <DashboardOutlined />,   label: 'Dashboard' },
  { key: '/customers',    icon: <TeamOutlined />,         label: 'Customer' },
  { key: '/promotions',   icon: <NotificationOutlined />, label: 'Promosi' },
  { key: '/reminders',    icon: <ClockCircleOutlined />,  label: 'Reminder' },
  { key: '/users',        icon: <UserOutlined />,         label: 'Pengguna' },
  { key: '/documentation',icon: <BookOutlined />,         label: 'Dokumentasi' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userMenu = {
    items: [
      {
        key: 'name',
        disabled: true,
        label: (
          <div style={{ padding: '2px 0' }}>
            <Text strong style={{ display: 'block' }}>{user?.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
          </div>
        )
      },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', danger: true }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
      }
    }
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
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 10,
          padding: '0 16px'
        }}>
          <WhatsAppOutlined style={{ fontSize: 22, color: '#4ade80', flexShrink: 0 }} />
          {!collapsed && (
            <Text strong style={{ color: 'white', fontSize: 15, whiteSpace: 'nowrap' }}>
              Jawara WA
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18, color: '#374151' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
              <Avatar style={{ background: '#128C7E', flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              {!collapsed && (
                <Text strong style={{ fontSize: 13 }}>{user?.name}</Text>
              )}
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
