import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, Typography, Card, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUser } from './hooks/useUser';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Users() {
  const {
    data,
    pagination,
    loading,
    modalOpen,
    editingRecord,
    form,
    currentUser,
    setModalOpen,
    fetchData,
    openCreate,
    openEdit,
    handleDelete,
    handleSubmit
  } = useUser();

  const columns = [
    { title: 'Nama', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telepon', dataIndex: 'phone', key: 'phone', render: v => v || '-' },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: v => <Tag color={v === 'admin' ? 'gold' : 'blue'}>{v === 'admin' ? 'Admin' : 'User'}</Tag>
    },
    {
      title: 'Status', dataIndex: 'isActive', key: 'isActive',
      render: v => <Tag color={v !== false ? 'green' : 'red'}>{v !== false ? 'Aktif' : 'Nonaktif'}</Tag>
    },
    {
      title: 'Aksi', key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Hapus pengguna ini?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak">
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.id === currentUser?.id} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Pengguna</Title>
          <Text type="secondary">Kelola akun admin dan user</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#25D366', borderColor: '#25D366' }}>
          Tambah Pengguna
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ ...pagination, onChange: (p, ps) => fetchData(p, ps), showTotal: t => `Total : ${t}` }} />
      </Card>

      <Modal
        title={editingRecord ? 'Edit Pengguna' : 'Tambah Pengguna'}
        open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
            <Input placeholder="Nama lengkap" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="password" label={editingRecord ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
            rules={editingRecord ? [] : [{ required: true, min: 6 }]}>
            <Input.Password placeholder="Minimal 6 karakter" />
          </Form.Item>
          <Form.Item name="phone" label="Telepon">
            <Input placeholder="08xxxxxxxxxx" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="user">
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingRecord ? 'Simpan' : 'Tambah'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
