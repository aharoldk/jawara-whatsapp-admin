import {
  Table, Button, Modal, Form, Input, Select, Space, DatePicker,
  Popconfirm, Typography, Card, Tag, Alert, Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePromotions } from './hooks/usePromotion';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLOR = { pending: 'blue', processing: 'orange', completed: 'green', failed: 'red', cancelled: 'default' };
const STATUS_LABEL = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal', cancelled: 'Dibatalkan' };

export default function Promotions() {
  const {
  data,
    pagination,
    loading,
    modalOpen,
    editingRecord,
    form,
    setModalOpen,
    fetchData,
    openCreate,
    openEdit,
    handleCancel,
    handleDelete,
    handleSubmit
  } = usePromotions();

  const columns = [
    { title: 'Nama', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    {
      title: 'Jadwal', dataIndex: 'scheduledAt', key: 'scheduledAt',
      render: v => dayjs(v).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
    },
    { title: 'Terkirim', dataIndex: 'sentCount', key: 'sentCount', render: v => <Tag color="green">{v}</Tag> },
    { title: 'Gagal', dataIndex: 'failedCount', key: 'failedCount', render: v => <Tag color="red">{v}</Tag> },
    {
      title: 'Berulang', dataIndex: 'recurringType', key: 'recurringType',
      render: v => v === 'none' ? '-' : <Tag color="purple">{v}</Tag>
    },
    {
      title: 'Aksi', key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}
            disabled={['processing', 'completed'].includes(record.status)} />
          {['pending'].includes(record.status) && (
            <Popconfirm title="Batalkan promosi ini?" onConfirm={() => handleCancel(record.id)} okText="Ya">
              <Button size="small" icon={<StopOutlined />} />
            </Popconfirm>
          )}
          {['pending', 'cancelled', 'failed'].includes(record.status) && (
            <Popconfirm title="Hapus promosi ini?" onConfirm={() => handleDelete(record.id)} okText="Ya">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Promosi</Title>
          <Text type="secondary">Jadwalkan pengiriman pesan promosi ke customer</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#25D366', borderColor: '#25D366' }}>
          Buat Promosi
        </Button>
      </div>

      <Alert
        style={{ marginBottom: 16, borderRadius: 8 }}
        type="info" showIcon
        message={<>Gunakan Mustache template: <code>{'{{fullName}}'}</code>, <code>{'{{data.lastServiceDate}}'}</code>, <code>{'{{data.vehicle}}'}</code></>}
      />

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ ...pagination, onChange: (p, ps) => fetchData(p, ps), showTotal: t => `Total : ${t}` }} />
      </Card>

      <Modal
        title={editingRecord ? 'Edit Promosi' : 'Buat Promosi'}
        open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nama Promosi" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Promo Valentine 2024" />
          </Form.Item>
          <Form.Item name="scheduledAt" label="Jadwal Kirim" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} placeholder="Pilih tanggal dan jam" />
          </Form.Item>
          <Form.Item name="recurringType" label="Pengulangan" initialValue="none">
            <Select>
              <Option value="none">Tidak Berulang</Option>
              <Option value="daily">Harian</Option>
              <Option value="weekly">Mingguan</Option>
              <Option value="monthly">Bulanan</Option>
              <Option value="yearly">Tahunan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="recurringEndDate" label="Tanggal Akhir Berulang (opsional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="message"
            label={<>Pesan Template <Tooltip title="Gunakan {{fullName}}, {{data.lastServiceDate}}, {{data.vehicle}}, dll"><InfoCircleOutlined style={{ color: '#25D366' }} /></Tooltip></>}
            rules={[{ required: true }]}
          >
            <TextArea rows={4}
              placeholder="Halo {{fullName}}, kami ada promo spesial untuk kamu! Service terakhir kamu: {{data.lastServiceDate}}" />
          </Form.Item>
          <Form.Item name="customerFilter.status" label="Filter Status Customer" initialValue="active">
            <Select>
              <Option value="active">Aktif</Option>
              <Option value="inactive">Tidak Aktif</Option>
              <Option value="blocked">Diblokir</Option>
            </Select>
          </Form.Item>
          <Form.Item name="customerFilter.tags" label="Filter Tags (opsional)">
            <Select mode="tags" placeholder="Pilih/tambah tag customer..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingRecord ? 'Simpan' : 'Buat Promosi'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
