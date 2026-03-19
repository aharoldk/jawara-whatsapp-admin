import { useState, useEffect, useCallback } from 'react';
import {
  Form,message
} from 'antd';
import { customersAPI } from '../../api';

export function useCustomer() {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [form] = Form.useForm();

    const fetchData = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
        const params = { page, limit: pageSize };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const res = await customersAPI.getAll(params);
        setData(res.data.data);
        setPagination({ current: page, pageSize, total: res.data.pagination.total });
        } catch (e) {
        message.error('Gagal memuat data customer');
        } finally {
        setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => {
        setEditingRecord(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
        fullName: record.fullName,
        whatsappNumber: record.whatsappNumber,
        address: record.address,
        status: record.status,
        notes: record.notes,
        lastOrder: record.data?.lastOrder,
        });
        setModalOpen(true);
    };

    const openView = (record) => { setViewingRecord(record); setDrawerOpen(true); };

    const handleSubmit = async (values) => {
        const { ibukandung, npwp, lastOrder, ...rest } = values;
        const payload = {
        ...rest,
        data: { ibukandung: ibukandung || '', npwp: npwp || '', lastOrder: lastOrder || '' }
        };
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

    const handleDelete = async (id) => {
        try {
        await customersAPI.delete(id);
        message.success('Customer berhasil dihapus');
        fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
        message.error('Gagal menghapus customer');
        }
    };

    return {
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
        setModalOpen,
        setDrawerOpen,
        fetchData,
        openCreate,
        openEdit,
        openView,
        handleDelete,
        handleSubmit
    }
}