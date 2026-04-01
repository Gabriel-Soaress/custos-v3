import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/Access.module.css';

export default function Signup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Mensagens de retorno do Stripe
    useEffect(() => {
        const checkoutStatus = searchParams.get('checkout');
        if (checkoutStatus === 'cancel') {
            setError('O pagamento foi cancelado. Você precisa de uma assinatura ativa para acessar o sistema.');
        }
    }, [searchParams]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('As senhas não coincidem.');
        }

        if (password.length < 6) {
            return setError('A senha deve ter pelo menos 6 caracteres.');
        }

        setLoading(true);
        try {
            // Chamada para criar usuário e gerar sessão de checkout
            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, { email, password });
            
            if (response.data.sessionUrl) {
                // Redireciona para o checkout do Stripe
                window.location.href = response.data.sessionUrl;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao processar cadastro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.priceBadge}>Assinatura Mensal: R$ 34,90</div>
                <h1 className={styles.title}>Comece Agora</h1>
                <p className={styles.subtitle}>Crie sua conta e ative sua assinatura premium</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSignup} className={styles.form}>
                    <input 
                        type="email" 
                        placeholder="E-mail profissional" 
                        className={styles.input}
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        placeholder="Crie uma senha forte" 
                        className={styles.input}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        placeholder="Confirme sua senha" 
                        className={styles.input}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className={styles.btn} disabled={loading}>
                        {loading ? 'PROCESSANDO...' : 'ASSINAR E CRIAR CONTA'}
                    </button>
                </form>

                <div className={styles.footer}>
                    Já tem uma assinatura? 
                    <Link to="/login" className={styles.link}>Fazer Login</Link>
                </div>
            </div>
        </div>
    );
}
