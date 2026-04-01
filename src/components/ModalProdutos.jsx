import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../modules/VendaDireta.module.css';

// Ícones SVG para o modal
const Icons = {
    Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Cloud: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
};

export default function ModalProdutos({ onClose, onSelectProduto }) {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarApi();
    }, []);

    const carregarApi = async () => {
        const token = localStorage.getItem('custos_token');
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/produtos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProdutos(res.data);
        } catch(e) { 
            console.error('Erro ao buscar produtos da nuvem', e); 
        } finally {
            setLoading(false);
        }
    };

    const deletarProduto = async (id) => {
        if (window.confirm("Excluir este produto definitivamente da nuvem?")) {
            const token = localStorage.getItem('custos_token');
            try {
                await axios.delete(`/api/produtos/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                await carregarApi();
            } catch(e) { 
                alert("Erro ao deletar produto!"); 
            }
        }
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['modal-header']}>
                    <h2 style={{display:'flex', alignItems:'center', gap:'8px'}}><Icons.Cloud /> Meus Produtos Salvos</h2>
                    <button onClick={onClose} className={styles['btn-close-icon']}>
                        <Icons.Close />
                    </button>
                </div>

                <div className={styles['preset-list']} style={{marginTop: '20px'}}>
                    {loading ? (
                        <div style={{textAlign:'center', padding: '40px 0', color:'#94a3b8'}}>
                            <p>Carregando da nuvem...</p>
                        </div>
                    ) : produtos.length === 0 ? (
                        <div style={{textAlign:'center', padding: '40px 0', color:'#94a3b8'}}>
                            <p>Nenhum produto salvo na nuvem ainda.</p>
                            <small>Utilize o botão 'Nuvem' na calculadora para salvar um novo.</small>
                        </div>
                    ) : (
                        produtos.map(prod => (
                            <div key={prod.id} className={styles['preset-item']} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight: 'bold', color: '#1e293b'}}>{prod.nome}</div>
                                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>
                                        Imposto: {prod.imposto}% | {prod.itens.length} itens de custo
                                    </div>
                                </div>
                                <div className={styles['action-buttons']} style={{display:'flex', gap:'10px'}}>
                                    <button 
                                        onClick={() => onSelectProduto(prod)} 
                                        style={{padding: '5px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                                    >
                                        Carregar
                                    </button>
                                    <button onClick={() => deletarProduto(prod.id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Excluir da Nuvem">
                                        <Icons.Trash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
