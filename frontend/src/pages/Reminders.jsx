import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, Typography, Card, Tag, Alert, Tooltip, Switch,
  Row, Col, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  InfoCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import { useReminder, OPERATORS_BY_TYPE, VALUE_PLACEHOLDER } from './hooks/useReminder';
import { STATUS_COLOR, STATUS_LABEL, FREQ_LABEL } from '../constants';

const { Title, Text } = Typography;
const { Option }      = Select;
const { TextArea }    = Input;

// ─── Visual Query Builder ─────────────────────────────────────────────────────
function QueryBuilder({ rules, allQueryFields, onAdd, onUpdate, onRemove }) {
  if (allQueryFields.length === 0) {
    return (
      <Alert type="warning" showIcon
        message="Belum ada field terdaftar"
        description="Tambahkan field di Settings → Template Field Customer terlebih dahulu."
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Hanya customer yang memenuhi SEMUA kondisi berikut yang akan menerima pesan
        </Text>
        <Button size="small" icon={<PlusOutlined />} onClick={onAdd}>
          Tambah Kondisi
        </Button>
      </div>

      {rules.length === 0 && (
        <div style={{
          border: '1px dashed #d9d9d9', borderRadius: 8,
          padding: '16px', textAlign: 'center', color: '#999'
        }}>
          Klik "Tambah Kondisi" untuk menentukan customer mana yang menerima reminder ini
        </div>
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        {rules.map((rule, idx) => {
          const selectedField = allQueryFields.find(f => f.key === rule.field);
          const fieldType     = selectedField?.type || 'text';
          const operators     = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;

          return (
            <div key={idx} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              background: '#fafafa', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              {/* Label kondisi ke-N */}
              <div style={{
                minWidth: 32, height: 32, borderRadius: 6,
                background: '#25D36618', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#25D366', fontWeight: 600
              }}>
                {idx + 1}
              </div>

              {/* Field selector */}
              <Select
                value={rule.field}
                style={{ flex: 2 }}
                onChange={val => onUpdate(idx, { field: val, op: '$eq', value: '' })}
                placeholder="Pilih field"
              >
                {allQueryFields.map(f => (
                  <Option key={f.key} value={f.key}>{f.label}</Option>
                ))}
              </Select>

              {/* Operator selector */}
              <Select
                value={rule.op}
                style={{ flex: 2 }}
                onChange={val => onUpdate(idx, { op: val })}
              >
                {operators.map(o => (
                  <Option key={o.value} value={o.value}>{o.label}</Option>
                ))}
              </Select>

              {/* Value input — select untuk type=select, text untuk lainnya */}
              {fieldType === 'select' && selectedField?.options?.length ? (
                <Select
                  value={rule.value}
                  style={{ flex: 3 }}
                  onChange={val => onUpdate(idx, { value: val })}
                  placeholder="Pilih nilai"
                  allowClear
                  mode={rule.op === '$in' ? 'multiple' : undefined}
                >
                  {selectedField.options.map(o => <Option key={o} value={o}>{o}</Option>)}
                </Select>
              ) : (
                <Input
                  value={rule.value}
                  style={{ flex: 3 }}
                  placeholder={VALUE_PLACEHOLDER[fieldType] || 'nilai...'}
                  onChange={e => onUpdate(idx, { value: e.target.value })}
                />
              )}

              {/* Remove */}
              <Button
                type="text" danger size="small"
                icon={<MinusCircleOutlined />}
                onClick={() => onRemove(idx)}
                style={{ marginTop: 4 }}
              />
            </div>
          );
        })}
      </Space>

      {/* Preview JSON (collapsed) */}
      {rules.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#999' }}>
            Lihat query MongoDB yang dihasilkan
          </summary>
          <pre style={{
            background: '#f5f5f5', padding: 10, borderRadius: 6,
            fontSize: 11, marginTop: 6, overflow: 'auto'
          }}>
            {JSON.stringify(
              Object.fromEntries(
                rules.filter(r => r.field && r.op).map(r => [r.field, { [r.op]: r.value }])
              ),
              null, 2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}

// ─── Message Variable Helper ──────────────────────────────────────────────────
function MessageVarHelper({ vars }) {
  return (
    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {vars.map(v => (
        <Tooltip key={v.key} title={`Contoh: ${v.example || v.key}`}>
          <Tag style={{ cursor: 'pointer', fontSize: 11 }}
            onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}>
            {`{{${v.key}}}`}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Reminders() {
  const {
    data, loading, pagination,
    modalOpen, testResult, editingRecord,
    queryRules, form,
    allQueryFields, allMessageVars,
    setModalOpen,
    fetchData, openCreate, openEdit,
    handleStatusToggle, handleSubmit,
    handleDelete, handleTest,
    addRule, updateRule, removeRule
  } = useReminder();

  const columns = [
    { title: 'Nama',      dataIndex: 'name',      render: v => <Text strong>{v}</Text> },
    {
      title: 'Frekuensi', dataIndex: 'frequency',
      render: v => <Tag color="purple">{FREQ_LABEL[v]}</Tag>
    },
    { title: 'Jam',       dataIndex: 'executeAt'  },
    {
      title: 'Status', dataIndex: 'status',
      render: (v, record) => (
        <Space>
          <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
          <Switch size="small" checked={v === 'active'} onChange={() => handleStatusToggle(record)} />
        </Space>
      )
    },
    { title: 'Sukses',  dataIndex: 'successCount', render: v => <Tag color="green">{v || 0}</Tag> },
    { title: 'Gagal',   dataIndex: 'failureCount', render: v => <Tag color="red">{v || 0}</Tag>   },
    {
      title: 'Aksi',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}   onClick={() => openEdit(record)} />
          <Popconfirm title="Hapus reminder?" onConfirm={() => handleDelete(record.id)} okText="Ya">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Reminder</Title>
          <Text type="secondary">Kirim pesan otomatis berdasarkan data customer</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#25D366', borderColor: '#25D366' }}>
          Buat Reminder
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ ...pagination, onChange: (p, ps) => fetchData(p, ps), showTotal: t => `Total : ${t}` }}
        />
      </Card>

      {/* Modal Create / Edit */}
      <Modal
        title={editingRecord ? 'Edit Reminder' : 'Buat Reminder'}
        open={modalOpen} onCancel={() => setModalOpen(false)}
        footer={null} width={720} destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nama Reminder" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Pengingat Service 30 Hari" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="executeAt" label="Jam Eksekusi"
                rules={[{ required: true, pattern: /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, message: 'Format HH:mm' }]}>
                <Input placeholder="09:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="frequency" label="Frekuensi" rules={[{ required: true }]}>
                <Select placeholder="Pilih frekuensi">
                  <Option value="daily">Harian</Option>
                  <Option value="weekly">Mingguan</Option>
                  <Option value="monthly">Bulanan</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select>
                  <Option value="active">Aktif</Option>
                  <Option value="inactive">Nonaktif</Option>
                  <Option value="paused">Dijeda</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Query Builder */}
          <Form.Item label={
            <Space>
              Filter Customer
              <Tooltip title="Hanya customer yang memenuhi kondisi ini yang akan menerima pesan reminder">
                <InfoCircleOutlined style={{ color: '#25D366' }} />
              </Tooltip>
            </Space>
          }>
            <QueryBuilder
              rules={queryRules}
              allQueryFields={allQueryFields}
              onAdd={addRule}
              onUpdate={updateRule}
              onRemove={removeRule}
            />
          </Form.Item>

          {/* Pesan */}
          <Form.Item
            name="message"
            label={
              <Space>
                Pesan
                <Tooltip title="Klik tag variabel di bawah untuk copy. Paste di dalam pesan.">
                  <InfoCircleOutlined style={{ color: '#25D366' }} />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true }]}
          >
            <TextArea rows={4}
              placeholder="Halo {{fullName}}, sudah {{daysElapsed}} hari sejak kunjungan terakhir. Yuk kunjungi kami lagi!" />
          </Form.Item>
          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Klik variabel untuk copy:</Text>
            <MessageVarHelper vars={allMessageVars} />
          </div>

          {/* Test result */}
          {editingRecord && testResult && (
            <Alert type="info" style={{ marginBottom: 16 }}
              message={`Ditemukan ${testResult.totalMatching} customer yang cocok`}
              description={
                testResult.sampleCustomers?.length
                  ? `Contoh: ${testResult.sampleCustomers.map(c => c.name).join(', ')}`
                  : ''
              }
            />
          )}

          <Divider />
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              {editingRecord && (
                <Button onClick={() => handleTest(editingRecord.id)}>Uji Filter</Button>
              )}
              <Button type="primary" htmlType="submit"
                style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingRecord ? 'Simpan' : 'Buat Reminder'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
