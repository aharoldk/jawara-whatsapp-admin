import { useState, useEffect, useCallback } from 'react';
import { App,  Form } from 'antd';
import { remindersAPI } from '../../api';
import { useSettings } from './useSettings';

// Operator yang tersedia per tipe field
export const OPERATORS_BY_TYPE = {
  text    : [
    { value: '$eq',      label: '= sama dengan'   },
    { value: '$ne',      label: '≠ tidak sama'     },
    { value: '$regex',   label: '~ mengandung'     }
  ],
  number  : [
    { value: '$eq',      label: '= sama dengan'   },
    { value: '$ne',      label: '≠ tidak sama'     },
    { value: '$gt',      label: '> lebih besar'    },
    { value: '$gte',     label: '≥ lebih besar/sama' },
    { value: '$lt',      label: '< lebih kecil'    },
    { value: '$lte',     label: '≤ lebih kecil/sama' }
  ],
  date    : [
    { value: '$eq',      label: '= tepat pada'     },
    { value: '$gt',      label: '> setelah'        },
    { value: '$gte',     label: '≥ sejak'          },
    { value: '$lt',      label: '< sebelum'        },
    { value: '$lte',     label: '≤ sampai dengan'  }
  ],
  select  : [
    { value: '$eq',      label: '= sama dengan'   },
    { value: '$ne',      label: '≠ tidak sama'     },
    { value: '$in',      label: '∈ salah satu dari'}
  ],
  tags    : [
    { value: '$in',      label: '∈ memiliki tag'   }
  ]
};

// Placeholder nilai per tipe
export const VALUE_PLACEHOLDER = {
  date  : 'TODAY / DATE_MINUS_30 / DATE_PLUS_7',
  number: '0',
  text  : 'nilai...',
  select: 'nilai...',
  tags  : 'tag1, tag2'
};

/**
 * Konversi array rule (dari builder) → object MongoDB query
 * Contoh: [{ field: 'status', op: '$eq', value: 'active' }]
 * → { status: { $eq: 'active' } }
 */
export function rulesToQuery(rules) {
  const query = {};
  for (const rule of rules) {
    if (!rule.field || !rule.op) continue;
    const val = rule.op === '$in'
      ? rule.value.split(',').map(s => s.trim()).filter(Boolean)
      : rule.value;
    query[rule.field] = { [rule.op]: val };
  }
  return query;
}

/**
 * Konversi MongoDB query → array rule (untuk mengisi builder)
 */
export function queryToRules(query) {
  if (!query || typeof query !== 'object') return [];
  return Object.entries(query).map(([field, cond]) => {
    if (typeof cond === 'object' && cond !== null) {
      const [op, val] = Object.entries(cond)[0];
      return {
        field,
        op,
        value: Array.isArray(val) ? val.join(', ') : String(val ?? '')
      };
    }
    return { field, op: '$eq', value: String(cond ?? '') };
  });
}

export function useReminder() {
  const { message } = App.useApp();
  const [data, setData]             = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Query builder: array of { field, op, value }
  const [queryRules, setQueryRules] = useState([]);

  const [form] = Form.useForm();
  const { allQueryFields, allMessageVars } = useSettings();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await remindersAPI.getAll({ page, limit: pageSize });
      setData(res.data.data);
      setPagination({ current: page, pageSize, total: res.data.pagination.total });
    } catch {
      message.error('Gagal memuat data reminder');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Open create ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingRecord(null);
    setTestResult(null);
    setQueryRules([]);
    form.resetFields();
    setModalOpen(true);
  };

  // ── Open edit ────────────────────────────────────────────────────────────
  const openEdit = (record) => {
    setEditingRecord(record);
    setTestResult(null);
    setQueryRules(queryToRules(record.queryConditions || {}));
    form.setFieldsValue({
      name     : record.name,
      message  : record.message,
      frequency: record.frequency,
      executeAt: record.executeAt,
      status   : record.status
    });
    setModalOpen(true);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    if (queryRules.length === 0) {
      message.error('Tambahkan minimal satu kondisi filter customer');
      return;
    }

    const queryConditions = rulesToQuery(queryRules);
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

  // ── Toggle status ────────────────────────────────────────────────────────
  const handleStatusToggle = async (record) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      await remindersAPI.updateStatus(record.id, newStatus);
      message.success(`Reminder ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchData();
    } catch {
      message.error('Gagal mengubah status');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await remindersAPI.delete(id);
      message.success('Reminder dihapus');
      fetchData();
    } catch {
      message.error('Gagal menghapus reminder');
    }
  };

  // ── Test query ───────────────────────────────────────────────────────────
  const handleTest = async (id) => {
    try {
      const res = await remindersAPI.testQuery(id);
      setTestResult(res.data.data);
    } catch {
      message.error('Gagal menguji query');
    }
  };

  // ── Query rule helpers ───────────────────────────────────────────────────
  const addRule = () => {
    const firstField = allQueryFields[0];
    setQueryRules(prev => [
      ...prev,
      { field: firstField?.key || 'status', op: '$eq', value: '' }
    ]);
  };

  const updateRule = (idx, patch) => {
    setQueryRules(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const removeRule = (idx) => {
    setQueryRules(prev => prev.filter((_, i) => i !== idx));
  };

  return {
    data, pagination, loading,
    modalOpen, editingRecord, testResult,
    queryRules, form,
    allQueryFields, allMessageVars,
    setModalOpen,
    fetchData,
    openCreate, openEdit,
    handleStatusToggle, handleSubmit,
    handleDelete, handleTest,
    addRule, updateRule, removeRule
  };
}
