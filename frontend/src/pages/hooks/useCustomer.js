import { useState, useEffect, useCallback } from 'react';
import { App,  Form } from 'antd';
import { customersAPI } from '../../api';
import { useSettings } from './useSettings';

export function useCustomer() {
  const { message } = App.useApp();
  const [data, setData]               = useState([]);
  const [pagination, setPagination]   = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading]         = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form] = Form.useForm();

  // Ambil template field dari settings
  const { customerFieldTemplate } = useSettings();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await customersAPI.getAll(params);
      setData(res.data.data);
      setPagination({ current: page, pageSize, total: res.data.pagination.total });
    } catch {
      message.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Open create ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  // ── Open edit ────────────────────────────────────────────────────────────
  const openEdit = (record) => {
    setEditingRecord(record);

    // Field standar
    const values = {
      fullName      : record.fullName,
      whatsappNumber: record.whatsappNumber,
      address       : record.address,
      status        : record.status,
      notes         : record.notes
    };

    // Field dinamis dari template — ambil dari data.extra
    for (const field of customerFieldTemplate) {
      values[`extra__${field.key}`] = record.data?.extra?.[field.key] ?? '';
    }

    form.setFieldsValue(values);
    setModalOpen(true);
  };

  const openView = (record) => { setViewingRecord(record); setDrawerOpen(true); };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    // Pisahkan field standar dan field ekstra (prefix "extra__")
    const extra  = {};
    const standard = {};

    for (const [k, v] of Object.entries(values)) {
      if (k.startsWith('extra__')) {
        const realKey = k.replace('extra__', '');
        extra[realKey] = v ?? '';
      } else {
        standard[k] = v;
      }
    }

    const payload = { ...standard, data: { extra } };

    try {
      if (editingRecord) {
        await customersAPI.update(editingRecord.id, payload);
        message.success('Customer berhasil diperbarui');
      } else {
        await customersAPI.create(payload);
        message.success('Customer berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal menyimpan customer');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await customersAPI.delete(id);
      message.success('Customer berhasil dihapus');
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('Gagal menghapus customer');
    }
  };

  return {
    data, pagination, loading,
    modalOpen, drawerOpen, viewingRecord, editingRecord,
    search, statusFilter, form,
    customerFieldTemplate,
    setSearch, setStatusFilter, setModalOpen, setDrawerOpen,
    fetchData, openCreate, openEdit, openView,
    handleDelete, handleSubmit
  };
}
