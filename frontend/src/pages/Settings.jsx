import { useState } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select,
  Space, Typography, Switch, Tag, Tooltip,
  Row, Col, Alert, Divider, Popconfirm
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useSettings, BUILTIN_MESSAGE_VARS } from './hooks/useSettings';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Tab 1: Template Field Customer ──────────────────────────────────────────
function FieldTemplateTab({ template, onSave, saving }) {
  const [fields, setFields]       = useState(template);
  const [modalOpen, setModal]     = useState(false);
  const [editingIdx, setEditing]  = useState(null);
  const [typeWatch, setTypeWatch] = useState('text');
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null); form.resetFields(); setTypeWatch('text'); setModal(true);
  };
  const openEdit = (record, idx) => {
    setEditing(idx);
    form.setFieldsValue({ ...record, options: record.options?.join(', ') });
    setTypeWatch(record.type);
    setModal(true);
  };

  const handleSubmit = (values) => {
    const field = {
      key        : values.key,
      label      : values.label,
      type       : values.type,
      required   : values.required || false,
      placeholder: values.placeholder || '',
      options    : values.type === 'select'
        ? (values.options || '').split(',').map(s => s.trim()).filter(Boolean)
        : [],
      order: editingIdx !== null ? fields[editingIdx].order : fields.length
    };
    setFields(editingIdx !== null
      ? fields.map((f, i) => i === editingIdx ? field : f)
      : [...fields, field]
    );
    setModal(false);
  };

  const columns = [
    {
      title: 'Key', dataIndex: 'key',
      render: v => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{v}</code>
    },
    { title: 'Label', dataIndex: 'label', render: v => <Text strong>{v}</Text> },
    { title: 'Tipe', dataIndex: 'type', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Wajib', dataIndex: 'required', render: v => v ? <Tag color="red">Ya</Tag> : <Tag>Tidak</Tag> },
    { title: 'Opsi', dataIndex: 'options', render: v => v?.length ? v.map(o => <Tag key={o}>{o}</Tag>) : '-' },
    {
      title: 'Aksi',
      render: (_, record, idx) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record, idx)} />
          <Popconfirm title="Hapus field ini?" onConfirm={() => setFields(fields.filter((_, i) => i !== idx))} okText="Ya">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Alert type="info" showIcon style={{ marginBottom: 16 }}
        message="Template Field Customer"
        description={
          <span>
            Definisikan field tambahan pada form Add/Edit Customer.
            Disimpan di <code>data.extra</code>. Contoh: <em>Jenis Kendaraan, Level Member, Tanggal Service.</em>
          </span>
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text type="secondary">{fields.length} field kustom</Text>
        <Space>
          <Button icon={<PlusOutlined />} onClick={openCreate}>Tambah Field</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving}
            onClick={() => onSave({ customerFieldTemplate: fields })}
            style={{ background: '#25D366', borderColor: '#25D366' }}>
            Simpan Template
          </Button>
        </Space>
      </div>

      <Table dataSource={fields} columns={columns} rowKey="key" size="small"
        pagination={false}
        locale={{ emptyText: 'Belum ada field kustom. Klik "Tambah Field" untuk mulai.' }}
      />

      <Divider orientation="left">
        <Text type="secondary" style={{ fontSize: 12 }}>Variabel pesan tersedia untuk Reminder & Promosi</Text>
      </Divider>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[...BUILTIN_MESSAGE_VARS, ...fields.map(f => ({ key: `data.${f.key}`, label: f.label }))].map(v => (
          <Tooltip key={v.key} title={`Ketik: {{${v.key}}}`}>
            <Tag style={{ cursor: 'default' }}>
              <code>{`{{${v.key}}}`}</code> — {v.label}
            </Tag>
          </Tooltip>
        ))}
      </div>

      <Modal title={editingIdx !== null ? 'Edit Field' : 'Tambah Field Kustom'}
        open={modalOpen} onCancel={() => setModal(false)} footer={null} width={520}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="key" label={
                <Space>Key <Tooltip title="Identifier unik — tidak dapat diubah setelah ada data customer"><InfoCircleOutlined /></Tooltip></Space>
              } rules={[
                { required: true }, { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: 'Hanya huruf, angka, underscore' }
              ]}>
                <Input placeholder="lastServiceDate" disabled={editingIdx !== null} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="label" label="Label" rules={[{ required: true }]}>
                <Input placeholder="Tanggal Service Terakhir" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Tipe Input" initialValue="text" rules={[{ required: true }]}>
                <Select onChange={setTypeWatch}>
                  <Option value="text">Teks</Option>
                  <Option value="number">Angka</Option>
                  <Option value="date">Tanggal</Option>
                  <Option value="select">Pilihan (Select)</Option>
                  <Option value="textarea">Teks Panjang</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="required" label="Wajib Diisi?" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="placeholder" label="Placeholder (opsional)">
            <Input placeholder="Teks bantuan..." />
          </Form.Item>
          {typeWatch === 'select' && (
            <Form.Item name="options" label={
              <Space>Opsi <Tooltip title="Pisahkan koma. Contoh: Bronze, Silver, Gold"><InfoCircleOutlined /></Tooltip></Space>
            } rules={[{ required: true, message: 'Wajib isi opsi untuk tipe select' }]}>
              <Input placeholder="Pilihan 1, Pilihan 2, Pilihan 3" />
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModal(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingIdx !== null ? 'Simpan' : 'Tambah'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { settings, loading, saving, saveSettings, customerFieldTemplate } = useSettings();

  if (loading || !settings) {
    return <Card loading style={{ borderRadius: 12 }}><div style={{ height: 300 }} /></Card>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Settings</Title>
        <Text type="secondary">Konfigurasi template field customer</Text>
      </div>
      <Card style={{ borderRadius: 12 }}>
        <FieldTemplateTab template={customerFieldTemplate} onSave={saveSettings} saving={saving} />
      </Card>
    </div>
  );
}
