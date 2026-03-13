import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Popconfirm, message, Typography, Card, Tag, Alert, Tooltip, Switch
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { remindersAPI } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLOR = { active: 'green', inactive: 'default', paused: 'orange' };
const STATUS_LABEL = { active: 'Aktif', inactive: 'Nonaktif', paused: 'Dijeda' };
const FREQ_LABEL = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' };

export default function Reminders() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await remindersAPI.getAll({ limit: 100 });
      setData(res.data.data);
    } catch { message.error('Gagal memuat data reminder'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingRecord(null); form.resetFields(); setTestResult(null); setModalOpen(true); };
  const openEdit = (record) => {
    setEditingRecord(record);
    setTestResult(null);
    form.setFieldsValue({
      name: record.name,
      message: record.message,
      frequency: record.frequency,
      executeAt: record.executeAt,
      status: record.status,
      queryConditions: JSON.stringify(record.queryConditions, null, 2)
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    let queryConditions;
    try {
      queryConditions = JSON.parse(values.queryConditions);
    } catch {
      message.error('Query Conditions harus berupa JSON yang valid');
      return;
    }
    const payload = { ...values, queryConditions };
    try {
      if (editingRecord) {
        await remindersAPI.update(editingRecord.id, payload);
        message.success('Reminder diperbarui');
      } else {
        await remindersAPI.create(payload);
        message.success('Reminder berhasil dibuat');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal menyimpan reminder');
    }
  };

  const handleStatusToggle = async (record) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      await remindersAPI.updateStatus(record.id, newStatus);
      message.success(`Reminder ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchData();
    } catch (e) { message.error('Gagal mengubah status'); }
  };

  const handleDelete = async (id) => {
    try {
      await remindersAPI.delete(id);
      message.success('Reminder dihapus');
      fetchData();
    } catch (e) { message.error('Gagal menghapus reminder'); }
  };

  const handleTest = async (id) => {
    try {
      const res = await remindersAPI.testQuery(id);
      setTestResult(res.data.data);
    } catch (e) { message.error('Gagal menguji query'); }
  };

  const columns = [
    { title: 'Nama', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    {
      title: 'Frekuensi', dataIndex: 'frequency', key: 'frequency',
      render: v => <Tag color="purple">{FREQ_LABEL[v]}</Tag>
    },
    { title: 'Jam', dataIndex: 'executeAt', key: 'executeAt' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v, record) => (
        <Space>
          <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
          <Switch size="small" checked={v === 'active'} onChange={() => handleStatusToggle(record)} />
        </Space>
      )
    },
    { title: 'Sukses', dataIndex: 'successCount', key: 'successCount', render: v => <Tag color="green">{v || 0}</Tag> },
    { title: 'Gagal', dataIndex: 'failureCount', key: 'failureCount', render: v => <Tag color="red">{v || 0}</Tag> },
    {
      title: 'Aksi', key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
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

      <Alert
        style={{ marginBottom: 16, borderRadius: 8 }} type="info" showIcon
        message={<>Query Conditions menggunakan filter MongoDB. Contoh: <code>{'{"data.lastServiceDate": {"$lt": "DATE_MINUS_30"}}'}</code></>}
      />

      <Card style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingRecord ? 'Edit Reminder' : 'Buat Reminder'}
        open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nama Reminder" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Pengingat Service 30 Hari" />
          </Form.Item>
          <Form.Item
            name="message"
            label={<>Pesan <Tooltip title="Gunakan {{fullName}}, {{daysElapsed}}, {{data.lastServiceDate}}, dll"><InfoCircleOutlined style={{ color: '#25D366' }} /></Tooltip></>}
            rules={[{ required: true }]}
          >
            <TextArea rows={3}
              placeholder="Halo {{fullName}}, sudah {{daysElapsed}} hari sejak service terakhir kamu pada {{data.lastServiceDate}}. Yuk jadwalkan service!" />
          </Form.Item>
          <Form.Item
            name="queryConditions"
            label={<>Query Conditions (JSON) <Tooltip title="Filter customer menggunakan operator MongoDB. Placeholder: TODAY, YESTERDAY, DATE_MINUS_N, DATE_PLUS_N"><InfoCircleOutlined style={{ color: '#25D366' }} /></Tooltip></>}
            rules={[{ required: true }]}
          >
            <TextArea rows={5} style={{ fontFamily: 'monospace', fontSize: 12 }}
              placeholder={'{\n  "status": "active",\n  "data.lastServiceDate": {\n    "$lt": "DATE_MINUS_30"\n  }\n}'} />
          </Form.Item>
          <Form.Item name="frequency" label="Frekuensi" rules={[{ required: true }]}>
            <Select placeholder="Pilih frekuensi">
              <Option value="daily">Harian</Option>
              <Option value="weekly">Mingguan</Option>
              <Option value="monthly">Bulanan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="executeAt" label="Jam Eksekusi (HH:mm)" rules={[{ required: true, pattern: /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, message: 'Format HH:mm (contoh: 09:00)' }]}>
            <Input placeholder="09:00" style={{ width: 120 }} />
          </Form.Item>

          {editingRecord && testResult && (
            <Alert
              type="info"
              message={`Ditemukan ${testResult.totalMatching} customer yang cocok`}
              description={testResult.sampleCustomers?.length ? `Contoh: ${testResult.sampleCustomers.map(c => c.name).join(', ')}` : ''}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Batal</Button>
              {editingRecord && (
                <Button onClick={() => handleTest(editingRecord.id)}>Uji Query</Button>
              )}
              <Button type="primary" htmlType="submit" style={{ background: '#25D366', borderColor: '#25D366' }}>
                {editingRecord ? 'Simpan' : 'Buat Reminder'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
