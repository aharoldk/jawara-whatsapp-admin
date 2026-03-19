import { useState, useEffect } from 'react';
import { App, 
  Form } from 'antd';
import { usersAPI } from '../../api';
import { useAuth } from '../../store/auth';

export function useUser() {
  const { message } = App.useApp();
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const { user: currentUser } = useAuth();

    const fetchData = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await usersAPI.getAll({page, limit: pageSize});
            setData(res.data.data);
            setPagination({ current: page, pageSize, total: res.data.pagination.total });
        } catch { 
            message.error('Gagal memuat data pengguna'); 
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditingRecord(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({ name: record.name, email: record.email, phone: record.phone, role: record.role });
        setModalOpen(true);
    };

    const handleSubmit = async (values) => {
        if (!editingRecord && !values.password) {
        message.error('Password wajib diisi untuk pengguna baru');
        return;
        }
        try {
        if (editingRecord) {
            const payload = { ...values };
            if (!payload.password) delete payload.password;
            await usersAPI.update(editingRecord.id, payload);
            message.success('Pengguna berhasil diperbarui');
        } else {
            await usersAPI.create(values);
            message.success('Pengguna berhasil ditambahkan');
        }
        setModalOpen(false);
        fetchData();
        } catch (e) {
        message.error(e.response?.data?.error?.message || 'Gagal menyimpan pengguna');
        }
    };

    const handleDelete = async (id) => {
        if (id === currentUser?.id) { message.error('Tidak bisa menghapus akun sendiri'); return; }
        try {
        await usersAPI.delete(id);
        message.success('Pengguna berhasil dihapus');
        fetchData();
        } catch { message.error('Gagal menghapus pengguna'); }
    };

    return {
        data,
        pagination,
        loading,
        modalOpen,
        editingRecord,
        form,
        currentUser,
        setModalOpen,
        fetchData,
        openCreate,
        openEdit,
        handleDelete,
        handleSubmit
    }
}