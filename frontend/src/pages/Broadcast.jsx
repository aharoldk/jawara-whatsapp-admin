import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Form, Input, Select, Transfer, Tag,
  Typography, Space, Divider, Alert, Progress, Modal, Statistic,
  Steps, Tooltip, Badge, message
} from 'antd';
import {
  SendOutlined, EyeOutlined, UserOutlined, WifiOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
  ReloadOutlined, LinkOutlined, MessageOutlined
} from '@ant-design/icons';
import { broadcastAPI } from '../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─── WhatsApp-style message bubble preview ───────────────────────────────────
function WaBubble({ caption }) {
  if (!caption) {
    return (
      <div style={{
        background: '#f0f0f0', borderRadius: 12, padding: '32px 24px',
        textAlign: 'center', color: '#999'
      }}>
        <MessageOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
        <Text type="secondary">Preview pesan akan muncul di sini</Text>
      </div>
    );
  }

  return (
    <div style={{ background: '#ECE5DD', borderRadius: 12, padding: 16, minHeight: 120 }}>
      <div style={{
        background: '#fff', borderRadius: '0 8px 8px 8px',
        padding: '10px 14px', maxWidth: 320,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        <pre style={{
          margin: 0, fontFamily: 'inherit', fontSize: 13,
          lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {caption}
        </pre>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'right', marginTop: 4 }}>
          {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </div>
    </div>
  );
}

// ─── Result summary modal ─────────────────────────────────────────────────────
function ResultModal({ open, result, onClose }) {
  if (!result) return null;
  const { summary, success, failed } = result;
  return (
    <Modal
      title="Hasil Broadcast"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose} type="primary" style={{ background: '#25D366' }}>Tutup</Button>}
      width={560}
    >
      <Row gutter={16} style={{ marginBottom: 24, marginTop: 8 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 10, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Statistic title="Berhasil" value={summary.sent}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 10, textAlign: 'center', background: '#fff2f0', border: '1px solid #ffccc7' }}>
            <Statistic title="Gagal" value={summary.failed}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 10, textAlign: 'center' }}>
            <Statistic title="Total" value={summary.total}
              prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      {failed?.length > 0 && (
        <>
          <Divider orientation="left"><Text type="danger">Gagal Terkirim</Text></Divider>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {failed.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid #f0f0f0'
              }}>
                <Text>{f.name || f.recipient}</Text>
                <Text type="danger" style={{ fontSize: 12 }}>{f.reason}</Text>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Broadcast() {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);

  // data
  const [customers, setCustomers]   = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);

  // UI state
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSessions, setLoadingSessions]   = useState(false);
  const [loadingPreview, setLoadingPreview]     = useState(false);
  const [sending, setSending]                   = useState(false);
  const [sendProgress, setSendProgress]         = useState(0);

  // preview & result
  const [previewCaption, setPreviewCaption] = useState('');
  const [result, setResult]                 = useState(null);
  const [resultOpen, setResultOpen]         = useState(false);

  // filter customers
  const [tagFilter, setTagFilter] = useState('');

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const params = {};
      if (tagFilter) params.tag = tagFilter;
      const res = await broadcastAPI.getCustomers(params);
      setCustomers(
        res.data.data.map((c) => ({
          key        : c.id,
          title      : c.name,
          description: c.whatsappNumber,
          tags       : c.tags
        }))
      );
    } catch {
      message.error('Gagal memuat daftar customer');
    } finally {
      setLoadingCustomers(false);
    }
  }, [tagFilter]);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await broadcastAPI.getSessions();
      setSessions(res.data.data || []);
    } catch {
      message.error('Gagal memuat sessions WhatsApp');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchSessions(); },  [fetchSessions]);

  // ── preview ──────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    const values = form.getFieldsValue();
    setLoadingPreview(true);
    try {
      const res = await broadcastAPI.preview({
        message : { text: values.text, link: values.link, linkLabel: values.linkLabel },
        customer: { name: 'NamaCustomer' }
      });
      setPreviewCaption(res.data.data.varied);
    } catch {
      // fallback: build locally
      const lines = [];
      lines.push('Halo *NamaCustomer* 👋\n');
      if (values.text) lines.push(values.text);
      if (values.link) {
        lines.push('');
        if (values.linkLabel) lines.push(`📎 ${values.linkLabel}`);
        lines.push(values.link);
      }
      setPreviewCaption(lines.join('\n'));
    } finally {
      setLoadingPreview(false);
    }
  };

  // update preview on field change (debounced via form watch)
  const watchedText      = Form.useWatch('text',      form);
  const watchedLink      = Form.useWatch('link',      form);
  const watchedLinkLabel = Form.useWatch('linkLabel', form);

  useEffect(() => {
    if (watchedText || watchedLink) {
      handlePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedText, watchedLink, watchedLinkLabel]);

  // ── send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    try {
      await form.validateFields();
    } catch {
      message.warning('Lengkapi form terlebih dahulu');
      return;
    }

    if (targetKeys.length === 0) {
      message.warning('Pilih minimal satu customer');
      return;
    }

    const values = form.getFieldsValue();

    if (!values.sessions || values.sessions.length === 0) {
      message.warning('Pilih minimal satu session WhatsApp');
      return;
    }

    Modal.confirm({
      title  : 'Kirim Broadcast?',
      content: (
        <div>
          <Paragraph>
            Pesan akan dikirim ke <Text strong>{targetKeys.length} customer</Text> melalui{' '}
            <Text strong>{values.sessions.length} session</Text>.
          </Paragraph>
          <Alert
            type="warning" showIcon
            message="Proses broadcast berjalan di server dan membutuhkan waktu. Jangan tutup browser."
          />
        </div>
      ),
      okText    : 'Ya, Kirim',
      cancelText: 'Batal',
      okButtonProps: { style: { background: '#25D366', borderColor: '#25D366' } },
      onOk: async () => {
        setSending(true);
        setSendProgress(10);
        try {
          // Simulate progress while waiting
          const timer = setInterval(() => {
            setSendProgress((p) => Math.min(p + 5, 85));
          }, 2000);

          const res = await broadcastAPI.send({
            sessions   : values.sessions,
            customerIds: targetKeys,
            message    : {
              text     : values.text,
              link     : values.link,
              linkLabel: values.linkLabel
            },
            options: {
              baseDelayMs    : values.baseDelayMs     ?? 5000,
              jitterMs       : values.jitterMs        ?? 3000,
              pauseEvery     : values.pauseEvery      ?? 20,
              pauseDurationMs: values.pauseDurationMs ?? 60000,
              varyText       : true,
              personalize    : true
            }
          });

          clearInterval(timer);
          setSendProgress(100);

          setResult(res.data.data);
          setResultOpen(true);
          message.success(res.data.message);
        } catch (e) {
          message.error(e.response?.data?.message || 'Broadcast gagal');
        } finally {
          setSending(false);
          setTimeout(() => setSendProgress(0), 1000);
        }
      }
    });
  };

  // ── all tags from customers ───────────────────────────────────────────────
  const allTags = [...new Set(customers.flatMap((c) => c.tags || []))];

  // ── select all helper ────────────────────────────────────────────────────
  const selectAll  = () => setTargetKeys(customers.map((c) => c.key));
  const clearAll   = () => setTargetKeys([]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Broadcast</Title>
        <Text type="secondary">Kirim pesan massal ke customer dengan gambar, teks, dan link</Text>
      </div>

      {/* Steps indicator */}
      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Steps
          current={step}
          onChange={setStep}
          items={[
            { title: 'Pilih Customer',   icon: <UserOutlined /> },
            { title: 'Buat Pesan',       icon: <MessageOutlined /> },
            { title: 'Pilih Session',    icon: <WifiOutlined /> },
            { title: 'Kirim',            icon: <SendOutlined /> },
          ]}
        />
      </Card>

      <Form form={form} layout="vertical">
        <Row gutter={20}>

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <Col xs={24} lg={14}>

            {/* STEP 0 — Customer selector */}
            <Card
              style={{ borderRadius: 12, marginBottom: 16 }}
              title={
                <Space>
                  <UserOutlined style={{ color: '#25D366' }} />
                  <Text strong>Pilih Customer</Text>
                  {targetKeys.length > 0 && (
                    <Badge count={targetKeys.length} style={{ background: '#25D366' }} />
                  )}
                </Space>
              }
              extra={
                <Space size="small">
                  <Select
                    placeholder="Filter tag"
                    allowClear
                    style={{ width: 130 }}
                    value={tagFilter || undefined}
                    onChange={(v) => setTagFilter(v || '')}
                  >
                    {allTags.map((t) => <Option key={t} value={t}>{t}</Option>)}
                  </Select>
                  <Button size="small" onClick={selectAll}>Pilih Semua</Button>
                  <Button size="small" onClick={clearAll}>Reset</Button>
                  <Button size="small" icon={<ReloadOutlined />} onClick={fetchCustomers} loading={loadingCustomers} />
                </Space>
              }
            >
              <Transfer
                dataSource={customers}
                titles={[
                  <Text key="src">Semua Customer ({customers.length})</Text>,
                  <Text key="tgt">Dipilih ({targetKeys.length})</Text>
                ]}
                targetKeys={targetKeys}
                onChange={(keys) => setTargetKeys(keys)}
                render={(item) => (
                  <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 13 }}>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{item.description}</Text>
                  </Space>
                )}
                listStyle={{ width: '100%', height: 300 }}
                showSearch
                filterOption={(val, item) =>
                  item.title.toLowerCase().includes(val.toLowerCase()) ||
                  item.description.includes(val)
                }
                style={{ width: '100%' }}
                loading={loadingCustomers}
              />
            </Card>

            {/* STEP 1 — Compose message */}
            <Card
              style={{ borderRadius: 12, marginBottom: 16 }}
              title={
                <Space>
                  <MessageOutlined style={{ color: '#25D366' }} />
                  <Text strong>Buat Pesan</Text>
                </Space>
              }
            >
              <Form.Item
                name="text"
                label="Teks Pesan"
                rules={[{ required: true, message: 'Teks pesan wajib diisi' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Tulis pesan promo di sini...&#10;&#10;Gunakan emoji untuk menarik perhatian 🎯"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={14}>
                  <Form.Item name="link" label={<Space><LinkOutlined />Link URL</Space>}>
                    <Input placeholder="https://tokoku.com/promo" />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name="linkLabel" label="Label Link">
                    <Input placeholder="Lihat promo disini" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* STEP 2 — Session selector */}
            <Card
              style={{ borderRadius: 12, marginBottom: 16 }}
              title={
                <Space>
                  <WifiOutlined style={{ color: '#25D366' }} />
                  <Text strong>Session WhatsApp</Text>
                </Space>
              }
              extra={
                <Button size="small" icon={<ReloadOutlined />} onClick={fetchSessions} loading={loadingSessions}>
                  Refresh
                </Button>
              }
            >
              {sessions.length === 0 ? (
                <Alert
                  type="warning" showIcon
                  message="Tidak ada session yang terkoneksi"
                  description="Hubungkan minimal satu nomor WhatsApp di menu WhatsApp terlebih dahulu."
                />
              ) : (
                <Form.Item
                  name="sessions"
                  rules={[{ required: true, message: 'Pilih minimal satu session' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Pilih session yang akan digunakan..."
                    style={{ width: '100%' }}
                  >
                    {sessions.map((s) => (
                      <Option key={s.name} value={s.name}>
                        <Space>
                          <Badge status="success" />
                          {s.name}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {s.me?.pushname || s.me?.id || ''}
                          </Text>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Card>

            {/* Advanced options (collapsed by default) */}
            <Card
              style={{ borderRadius: 12, marginBottom: 16 }}
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: '#999' }} />
                  <Text strong>Pengaturan Anti-Spam</Text>
                  <Tag color="blue">Opsional</Tag>
                </Space>
              }
              size="small"
            >
              <Alert
                type="info" showIcon style={{ marginBottom: 16 }}
                message="Nilai default sudah dioptimalkan untuk keamanan. Ubah hanya jika perlu."
              />
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="baseDelayMs" label="Delay antar pesan (ms)" initialValue={5000}>
                    <Input type="number" min={1000} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="jitterMs" label="Variasi delay ± (ms)" initialValue={3000}>
                    <Input type="number" min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="pauseEvery" label="Jeda panjang tiap N pesan" initialValue={20}>
                    <Input type="number" min={5} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="pauseDurationMs" label="Durasi jeda panjang (ms)" initialValue={60000}>
                    <Input type="number" min={10000} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* ── RIGHT COLUMN — Preview + Send ───────────────────────────── */}
          <Col xs={24} lg={10}>
            <div style={{ position: 'sticky', top: 80 }}>
              {/* Preview bubble */}
              <Card
                style={{ borderRadius: 12, marginBottom: 16 }}
                title={
                  <Space>
                    <EyeOutlined style={{ color: '#25D366' }} />
                    <Text strong>Preview Pesan</Text>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handlePreview}
                    loading={loadingPreview}
                  >
                    Refresh
                  </Button>
                }
              >
                <WaBubble caption={previewCaption} />
                <Divider style={{ margin: '12px 0' }} />
                <Alert
                  type="info" showIcon
                  message={
                    <Text style={{ fontSize: 12 }}>
                      Sapa nama customer, variasi emoji, dan invisible character
                      diterapkan otomatis per penerima untuk menghindari deteksi spam.
                    </Text>
                  }
                />
              </Card>

              {/* Summary card */}
              <Card style={{ borderRadius: 12, marginBottom: 16 }}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic
                      title="Customer Dipilih"
                      value={targetKeys.length}
                      prefix={<UserOutlined />}
                      valueStyle={{ color: '#25D366' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Session Aktif"
                      value={sessions.length}
                      prefix={<WifiOutlined />}
                      valueStyle={{ color: sessions.length > 0 ? '#25D366' : '#ff4d4f' }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Progress bar (visible while sending) */}
              {sending && (
                <Card style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Text strong>Sedang mengirim broadcast...</Text>
                  <Progress
                    percent={sendProgress}
                    strokeColor={{ '0%': '#25D366', '100%': '#128C7E' }}
                    style={{ marginTop: 8 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Proses berjalan di server. Jangan tutup browser.
                  </Text>
                </Card>
              )}

              {/* Send button */}
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                block
                onClick={handleSend}
                loading={sending}
                disabled={targetKeys.length === 0 || sessions.length === 0}
                style={{
                  background: '#25D366',
                  borderColor: '#25D366',
                  height: 48,
                  borderRadius: 10,
                  fontSize: 15
                }}
              >
                {sending
                  ? 'Mengirim...'
                  : `Kirim ke ${targetKeys.length} Customer`}
              </Button>

              {targetKeys.length === 0 && (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
                  Pilih customer terlebih dahulu
                </Text>
              )}
            </div>
          </Col>
        </Row>
      </Form>

      {/* Result Modal */}
      <ResultModal
        open={resultOpen}
        result={result}
        onClose={() => { setResultOpen(false); setResult(null); }}
      />
    </div>
  );
}
