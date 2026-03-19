import {
  Table, Button, Modal, Form, Input, Select, Tag, Space,
  Popconfirm, Typography, Card, Row, Col, Drawer, Descriptions
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { STATUS_COLOR, STATUS_LABEL } from '../constants';
import { useCustomer } from './hooks/useCustomer';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function Customers() {
  const {
    data,
    pagination,
    loading,
    modalOpen,
    drawerOpen,
    viewingRecord,
    editingRecord,
    search,
    statusFilter,
    form,
    setSearch,
    setStatusFilter,
    fetchData,
    setModalOpen,
    setDrawerOpen,
    openCreate,
    openEdit,
    openView,
    handleDelete,
    handleSubmit
  } = useCustomer();

  const columns = [
    { title: 'Nama', dataIndex: 'fullName', key: 'fullName', render: (v) => <Text strong>{v}</Text> },
    { title: 'WhatsApp', dataIndex: 'whatsappNumber', key: 'whatsappNumber' },
    { title: 'Alamat', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
    },
    {
      title: 'Last Service', dataIndex: ['data', 'lastServiceDate'], key: 'lastServiceDate',
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Aksi', key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openView(record)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Hapus customer ini?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Customer</Title>
          <Text type="secondary">Kelola data customer WhatsApp</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#25D366', borderColor: '#25D366' }}>
          Tambah Customer
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={12}>
          <Col flex="auto">
            <Input placeholder="Cari nama, nomor WA..." prefix={<SearchOutlined />}
              value={search} onChange={e => setSearch(e.target.value)}
              onPressEnter={() => fetchData(1, pagination.pageSize)} allowClear />
          </Col>
          <Col>
            <Select placeholder="Status" style={{ width: 140 }} allowClear
              value={statusFilter || undefined} onChange={v => setStatusFilter(v || '')}>
              <Option value="active">Aktif</Option>
              <Option value="inactive">Tidak Aktif</Option>
              <Option value="blocked">Diblokir</Option>
            </Select>
          </Col>
          <Col>
            <Button onClick={() => fetchData(1, pagination.pageSize)}>Cari</Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{
            ...pagination,
            onChange: (p, ps) => fetchData(p, ps),
            showTotal: (t) => `Total : ${t}`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Customer' : 'Tambah Customer'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        footer={null} width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="fullName" label="Nama Lengkap" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Budi Santoso" />
          </Form.Item>
          <Form.Item name="whatsappNumber" label="Nomor WhatsApp" rules={[{ required: true }]}>
            <Input placeholder="628123456789" />
          </Form.Item>
          <Form.Item name="address" label="Alamat">
            <TextArea rows={2} placeholder="Alamat lengkap" />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Option value="active">Aktif</Option>
              <Option value="inactive">Tidak Aktif</Option>
              <Option value="blocked">Diblokir</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingRecord ? 'Simpan Perubahan' : 'Tambah Customer'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Drawer */}
      <Drawer title="Detail Customer" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={440}>
        {viewingRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Nama">{viewingRecord.fullName}</Descriptions.Item>
            <Descriptions.Item label="WhatsApp">{viewingRecord.whatsappNumber}</Descriptions.Item>
            <Descriptions.Item label="Alamat">{viewingRecord.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={STATUS_COLOR[viewingRecord.status]}>{STATUS_LABEL[viewingRecord.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="Tags">{viewingRecord.tags?.map(t => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
            <Descriptions.Item label="Ibu Kandung">{viewingRecord.data?.ibukandung || '-'}</Descriptions.Item>
            <Descriptions.Item label="NPWP">{viewingRecord.data?.npwp || '-'}</Descriptions.Item>
            <Descriptions.Item label="Last Service">
              {viewingRecord.data?.lastServiceDate ? dayjs(viewingRecord.data.lastServiceDate).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Last Order">{viewingRecord.data?.lastOrder || '-'}</Descriptions.Item>
            <Descriptions.Item label="Kendaraan">{viewingRecord.data?.vehicle?.join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="Catatan">{viewingRecord.notes || '-'}</Descriptions.Item>
            <Descriptions.Item label="Dibuat">{dayjs(viewingRecord.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Terakhir Dihubungi">
              {viewingRecord.lastContactedAt ? dayjs(viewingRecord.lastContactedAt).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
