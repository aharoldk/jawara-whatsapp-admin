import { useState, useEffect, useCallback } from 'react';
import { promotionsAPI } from '../../api';
import { App, 
  Form } from 'antd';
import dayjs from 'dayjs';

export function usePromotions() {
  const { message } = App.useApp();
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    const fetchData = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
        const res = await promotionsAPI.getAll({ page, limit: pageSize });
        setData(res.data.data);
        setPagination({ current: page, pageSize, total: res.data.pagination.total });
        } catch { message.error('Gagal memuat data promosi'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => { setEditingRecord(null); form.resetFields(); setModalOpen(true); };
    const openEdit = (record) => {
        if (['processing', 'completed'].includes(record.status)) { message.warning('Tidak bisa edit promosi dengan status ini'); return; }
        setEditingRecord(record);
        form.setFieldsValue({
        name: record.name,
        message: record.message,
        scheduledAt: record.scheduledAt ? dayjs(record.scheduledAt) : null,
        recurringType: record.recurringType,
        recurringEndDate: record.recurringEndDate ? dayjs(record.recurringEndDate) : null,
        'customerFilter.status': record.customerFilter?.status,
        'customerFilter.tags': record.customerFilter?.tags
        });
        setModalOpen(true);
    };

    const handleSubmit = async (values) => {
        const payload = {
        name: values.name,
        message: values.message,
        scheduledAt: values.scheduledAt?.toISOString(),
        recurringType: values.recurringType || 'none',
        recurringEndDate: values.recurringEndDate?.toISOString() || null,
        customerFilter: {
            status: values['customerFilter.status'] || 'active',
            tags: values['customerFilter.tags'] || []
        }
        };
        try {
        if (editingRecord) {
            await promotionsAPI.update(editingRecord.id, payload);
            message.success('Promosi diperbarui');
        } else {
            await promotionsAPI.create(payload);
            message.success('Promosi berhasil dibuat');
        }
        setModalOpen(false);
        fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
        message.error(e.response?.data?.error?.message || 'Gagal menyimpan promosi');
        }
    };

    const handleCancel = async (id) => {
        try {
        await promotionsAPI.cancel(id);
        message.success('Promosi dibatalkan');
        fetchData(pagination.current, pagination.pageSize);
        } catch (e) { message.error(e.response?.data?.error?.message || 'Gagal membatalkan'); }
    };

    const handleDelete = async (id) => {
        try {
        await promotionsAPI.delete(id);
        message.success('Promosi dihapus');
        fetchData(pagination.current, pagination.pageSize);
        } catch (e) { message.error(e.response?.data?.error?.message || 'Gagal menghapus'); }
    };

    return {
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
    }
}