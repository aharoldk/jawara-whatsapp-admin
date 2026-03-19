import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, InputNumber,
  Popconfirm, Typography, Card, Row, Col, Drawer, Descriptions, DatePicker, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { STATUS_COLOR, STATUS_LABEL } from '../constants';
import { useCustomer } from './hooks/useCustomer';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── Render satu field dinamis berdasarkan type ────────────────────────────
function DynamicField({ field }) {
  const name  = `extra__${field.key}`;
  const rules = field.required ? [{ required: true, message: `${field.label} wajib diisi` }] : [];

  const input = (() => {
    switch (field.type) {
      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder} />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} placeholder={field.placeholder || 'Pilih tanggal'} format="DD/MM/YYYY" />;
      case 'select':
        return (
          <Select placeholder={field.placeholder || `Pilih ${field.label}`} allowClear>
            {(field.options || []).map(o => <Option key={o} value={o}>{o}</Option>)}
          </Select>
        );
      case 'textarea':
        return <TextArea rows={2} placeholder={field.placeholder} />;
      default:
        return <Input placeholder={field.placeholder} />;
    }
  })();

  return (
    <Form.Item key={name} name={name} label={field.label} rules={rules}>
      {input}
    </Form.Item>
  );
}

// ─── Render nilai field extra di Drawer ───────────────────────────────────
function ExtraValue({ field, value }) {
  if (!value && value !== 0) return '-';
  if (field.type === 'date') {
    return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : String(value);
  }
  return String(value);
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function Customers() {
  const navigate = useNavigate();
  const {
    data, pagination, loading,
    modalOpen, drawerOpen, viewingRecord, editingRecord,
    search, statusFilter, form,
    customerFieldTemplate,
    setSearch, setStatusFilter, setModalOpen, setDrawerOpen,
    fetchData, openCreate, openEdit, openView,
    handleDelete, handleSubmit
  } = useCustomer();

  const columns = [
    { title: 'Nama',      dataIndex: 'fullName',       render: v => <Text strong>{v}</Text> },
    { title: 'WhatsApp',  dataIndex: 'whatsappNumber'  },
    { title: 'Alamat',    dataIndex: 'address',  ellipsis: true },
    {
      title: 'Status', dataIndex: 'status',
      render: v => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
    },
    // Kolom dinamis: tampilkan field pertama dari template (jika ada)
    ...(customerFieldTemplate.slice(0, 2).map(f => ({
      title    : f.label,
      key      : f.key,
      ellipsis : true,
      render   : (_, record) => {
        const val = record.data?.extra?.[f.key];
        if (!val && val !== 0) return '-';
        if (f.type === 'date') return dayjs(val).isValid() ? dayjs(val).format('DD/MM/YYYY') : val;
        return String(val);
      }
    }))),
    {
      title: 'Aksi',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}    onClick={() => openView(record)} />
          <Button size="small" icon={<EditOutlined />}   onClick={() => openEdit(record)} />
          <Popconfirm title="Hapus customer ini?" onConfirm={() => handleDelete(record.id)} okText="Ya">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Customer</Title>
          <Text type="secondary">Kelola data customer WhatsApp</Text>
        </div>
        <Space>
          {customerFieldTemplate.length === 0 && (
            <Button icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
              Atur Template Field
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ background: '#25D366', borderColor: '#25D366' }}>
            Tambah Customer
          </Button>
        </Space>
      </div>

      {/* Filter */}
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

      {/* Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ ...pagination, onChange: (p, ps) => fetchData(p, ps), showTotal: t => `Total : ${t}` }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Customer' : 'Tambah Customer'}
        open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={620}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          {/* Field standar */}
          <Form.Item name="fullName" label="Nama Lengkap" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Budi Santoso" />
          </Form.Item>
          <Form.Item name="whatsappNumber" label="Nomor WhatsApp" rules={[{ required: true }]}>
            <Input placeholder="628123456789" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="address" label="Alamat">
                <TextArea rows={2} placeholder="Alamat lengkap" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select>
                  <Option value="active">Aktif</Option>
                  <Option value="inactive">Tidak Aktif</Option>
                  <Option value="blocked">Diblokir</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Catatan">
            <TextArea rows={2} />
          </Form.Item>

          {/* Field dinamis dari template */}
          {customerFieldTemplate.length > 0 && (
            <>
              <Divider orientation="left" style={{ fontSize: 13, color: '#666' }}>
                Data Tambahan
              </Divider>
              {customerFieldTemplate.map(field => (
                <DynamicField key={field.key} field={field} />
              ))}
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit"
                style={{ background: '#25D366', borderColor: '#25D366' }}>
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
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLOR[viewingRecord.status]}>{STATUS_LABEL[viewingRecord.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {viewingRecord.tags?.length ? viewingRecord.tags.map(t => <Tag key={t}>{t}</Tag>) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Catatan">{viewingRecord.notes || '-'}</Descriptions.Item>

            {/* Field dinamis */}
            {customerFieldTemplate.map(field => (
              <Descriptions.Item key={field.key} label={field.label}>
                <ExtraValue field={field} value={viewingRecord.data?.extra?.[field.key]} />
              </Descriptions.Item>
            ))}

            <Descriptions.Item label="Dibuat">
              {dayjs(viewingRecord.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Terakhir Dihubungi">
              {viewingRecord.lastContactedAt
                ? dayjs(viewingRecord.lastContactedAt).format('DD/MM/YYYY HH:mm')
                : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
