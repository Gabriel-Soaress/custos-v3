import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/Access.module.css';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
            
            // Salvar Token, Email e Status
            localStorage.setItem('custos_token', response.data.token);
            localStorage.setItem('custos_user_email', response.data.email);
            localStorage.setItem('custos_user_status', response.data.status);

            if (response.data.status === 'active') {
                navigate('/dashboard');
            } else {
                setError('Sua assinatura não está ativa. Por favor, regularize para continuar.');
                // Opcional: redirecionar para uma página de "assinatura pendente"
            }
        } catch (err) {
            setError(err.response?.data?.error || 'E-mail ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <h1 className={styles.title}>Bem-vindo de Volta</h1>
                <p className={styles.subtitle}>Acesse sua central de controle de custos</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin} className={styles.form}>
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        className={styles.input}
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        className={styles.input}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className={styles.btn} disabled={loading}>
                        {loading ? 'CARREGANDO...' : 'ENTRAR NO SISTEMA'}
                    </button>
                </form>

                <div className={styles.footer}>
                    Novo por aqui? 
                    <Link to="/signup" className={styles.link}>Criar sua conta</Link>
                </div>
            </div>
        </div>
    );
}