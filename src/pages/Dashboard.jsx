import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/Dashboard.module.css';

const Icons = {
    Tag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
    TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
    Dollar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    Box: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
    Store: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>,
    LogOut: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    WhatsApp: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('custos_token');
        const email = localStorage.getItem('custos_user_email');
        
        if (!token) {
            navigate('/');
            return;
        }

        setUserEmail(email || 'Usuário');

        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error("Erro ao buscar stats do dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('custos_token');
        localStorage.removeItem('custos_user_email');
        navigate('/');
    };

    if (loading) {
        return <div className={styles.loading}>Carregando painel...</div>;
    }

    return (
        <div className={styles.wrapper}>
            {/* NOVO BARRA DE NAVEGAÇÃO SUPERIOR */}
            <nav className={styles.navbar}>
                <div className={styles.logoArea}>
                    <h1 className={styles.logoText}>Controle<span>Custos</span></h1>
                </div>
                <div className={styles.userArea}>
                    <div className={styles.userInfo}>
                        <Icons.User />
                        <span>{userEmail}</span>
                    </div>
                    <button type="button" onClick={handleLogout} className={styles.btnLogout} title="Sair do sistema">
                        <Icons.LogOut />
                        <span>Sair</span>
                    </button>
                </div>
            </nav>

            <main className={styles.container}>
                <header className={styles.pageHeader}>
                    <h2 className={styles.welcomeText}>Bem-vindo ao seu Resumo 📊</h2>
                    <p className={styles.helpText}>Veja o desempenho da sua base de produtos e acesse ferramentas de cálculo.</p>
                </header>

                {/* BOARD DE MÉTRICAS */}
                <section className={styles.metricsBoard}>
                    <div className={styles.metricCard}>
                        <div className={`${styles.iconCircle} ${styles.bgBlue}`}><Icons.Tag /></div>
                        <div className={styles.metricInfo}>
                            <h3>Total de Itens</h3>
                            <p>{stats?.totalProdutos || 0}</p>
                        </div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={`${styles.iconCircle} ${styles.bgPurple}`}><Icons.TrendingUp /></div>
                        <div className={styles.metricInfo}>
                            <h3>Custo Médio</h3>
                            <p>R$ {(stats?.custoMedio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={`${styles.iconCircle} ${styles.bgOrange}`}><Icons.Dollar /></div>
                        <div className={styles.metricInfo}>
                            <h3>Maior Investimento</h3>
                            <p>R$ {(stats?.maiorCusto?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <small>{stats?.maiorCusto?.nome || 'Nenhum'}</small>
                        </div>
                    </div>
                </section>

                <div className={styles.mainGrid}>
                    {/* ACESSO RÁPIDO - LADO ESQUERDO */}
                    <section className={styles.cardSection}>
                        <h3 className={styles.cardTitle}>O que deseja fazer?</h3>
                        <div className={styles.actionGrid}>
                            <Link to="/direta" className={styles.actionItem}>
                                <div className={`${styles.actionIcon} ${styles.colorPurple}`}><Icons.Box /></div>
                                <span>Venda Direta</span>
                            </Link>
                            <Link to="/shopee" className={styles.actionItem}>
                                <div className={`${styles.actionIcon} ${styles.colorRed}`}><Icons.Store /></div>
                                <span>Venda em Lojas</span>
                            </Link>
                            <Link to="/reversa" className={styles.actionItem}>
                                <div className={`${styles.actionIcon} ${styles.colorBlue}`}><Icons.Refresh /></div>
                                <span>Calc. Reversa</span>
                            </Link>
                        </div>
                    </section>

                    {/* ATIVIDADE RECENTE - LADO DIREITO */}
                    <section className={styles.cardSection}>
                        <h3 className={styles.cardTitle}>Recém Cadastrados</h3>
                        <div className={styles.tableWrapper}>
                            {stats?.ultimosProdutos?.length > 0 ? (
                                <table className={styles.recentTable}>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Custo</th>
                                            <th>Lucro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.ultimosProdutos.map(prod => (
                                            <tr key={prod.id}>
                                                <td className={styles.nameCell}>{prod.nome}</td>
                                                <td>R$ {prod.custo_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    <span className={styles.profitBadge}>
                                                        {prod.unidade_lucro === 'R$' ? 'R$' : ''}{prod.lucro_desejado}{prod.unidade_lucro === '%' ? '%' : ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className={styles.emptyTable}>
                                    <p>Nenhum produto cadastrado na nuvem.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* RODAPÉ DE SUPORTE */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <p>© 2026 Controle de Custos · Todos os direitos reservados</p>
                    <a 
                        href="https://wa.me/5518997877147?text=Olá,%20preciso%20de%20suporte%20no%20sistema%20Controle%20de%20Custos" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.supportLink}
                    >
                        <Icons.WhatsApp />
                        <span>Chamar Suporte via WhatsApp</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}