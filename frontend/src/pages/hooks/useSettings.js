import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { settingsAPI } from '../../api';

// Built-in fields yang selalu tersedia di query builder (tidak perlu di template)
export const BUILTIN_FIELDS = [
  { key: 'status',           label: 'Status Customer',       type: 'select',   options: ['active', 'inactive', 'blocked'] },
  { key: 'tags',             label: 'Tags',                  type: 'tags'                                                  },
  { key: 'lastContactedAt',  label: 'Terakhir Dihubungi',    type: 'date'                                                  },
  { key: 'createdAt',        label: 'Tanggal Daftar',        type: 'date'                                                  },
];

// Built-in variabel pesan yang selalu tersedia
export const BUILTIN_MESSAGE_VARS = [
  { key: 'fullName',       label: 'Nama Lengkap',         example: 'Budi Santoso'  },
  { key: 'whatsappNumber', label: 'Nomor WhatsApp',        example: '6281234567890' },
  { key: 'address',        label: 'Alamat',                example: 'Jakarta Selatan' },
  { key: 'daysElapsed',    label: 'Hari Berlalu',          example: '30'            },
  { key: 'tags',           label: 'Tags',                  example: 'vip, loyal'   },
];

export function useSettings() {
  const { message } = App.useApp();
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.data);
    } catch {
      message.error('Gagal memuat settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (payload) => {
    setSaving(true);
    try {
      const res = await settingsAPI.update(payload);
      setSettings(res.data.data);
      message.success('Settings berhasil disimpan');
      return res.data.data;
    } catch (e) {
      message.error(e.response?.data?.error?.message || 'Gagal menyimpan settings');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Semua field yang tersedia untuk query builder reminder
  const allQueryFields = [
    ...BUILTIN_FIELDS,
    ...(settings?.customerFieldTemplate || []).map(f => ({
      key  : `data.extra.${f.key}`,
      label: f.label,
      type : f.type,
      options: f.options
    }))
  ];

  // Semua variabel yang bisa dipakai di pesan ({{variabel}})
  const allMessageVars = [
    ...BUILTIN_MESSAGE_VARS,
    ...(settings?.customerFieldTemplate || []).map(f => ({
      key    : `data.${f.key}`,
      label  : f.label,
      example: f.type === 'date' ? '01/01/2024' : `contoh ${f.label}`
    }))
  ];

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    saveSettings,
    allQueryFields,
    allMessageVars,
    customerFieldTemplate: settings?.customerFieldTemplate || []
  };
}
