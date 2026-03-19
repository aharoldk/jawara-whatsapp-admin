import { useState, useEffect, useCallback } from 'react';
import { remindersAPI } from '../../api';
import { message } from 'antd';
import { Form } from 'antd';

export function useReminder() {
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

    return {
        data,
        loading,
        modalOpen,
        testResult,
        editingRecord,
        form,
        setModalOpen,
        openCreate,
        openEdit,
        setEditingRecord,
        handleStatusToggle,
        handleSubmit,
        handleDelete,
        handleTest
    }
}