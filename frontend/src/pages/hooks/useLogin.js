import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

export function useLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Login gagal. Periksa email dan password.');
        } finally {
            setLoading(false);
        }

    };

    return {
        loading,
        error,
        handleLogin
    }
}