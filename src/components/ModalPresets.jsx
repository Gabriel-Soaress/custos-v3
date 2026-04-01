import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../modules/VendaDireta.module.css';

// Ícones SVG para design flat profissional
const Icons = {
    Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
};

export default function ModalPresets({ onClose, onUpdatePresets }) {
    const [activeTab, setActiveTab] = useState('list');
    const [presets, setPresets] = useState([]);

    // Estados para criação/edição
    const [editingId, setEditingId] = useState(null);
    const [novoNome, setNovoNome] = useState('');
    const [novoItem, setNovoItem] = useState('');
    const [listaItensTemp, setListaItensTemp] = useState([]);

    useEffect(() => {
        carregarApi();
    }, []);

    const carregarApi = async () => {
        const token = localStorage.getItem('custos_token');
        if (!token) return;
        try {
            const res = await axios.get('/api/presets', { headers: { Authorization: `Bearer ${token}` } });
            setPresets(res.data);
            if (onUpdatePresets) onUpdatePresets();
        } catch(e) { 
            console.error('Erro ao buscar presets da nuvem', e);
            const salvos = JSON.parse(localStorage.getItem('user_presets') || '[]');
            setPresets(salvos);
        }
    };

    const adicionarItemTemp = (e) => {
        e.preventDefault();
        if (!novoItem.trim()) return;
        setListaItensTemp([...listaItensTemp, novoItem]);
        setNovoItem('');
    };

    const removerItemTemp = (index) => {
        const novaLista = [...listaItensTemp];
        novaLista.splice(index, 1);
        setListaItensTemp(novaLista);
    };

    const iniciarEdicao = (preset) => {
        setEditingId(preset.id);
        setNovoNome(preset.nome);
        setListaItensTemp([...preset.itens]);
        setActiveTab('create');
    };

    const cancelarEdicao = () => {
        setEditingId(null);
        setNovoNome('');
        setListaItensTemp([]);
        setActiveTab('list');
    };

    const salvarPreset = async () => {
        if (!novoNome.trim() || listaItensTemp.length === 0) {
            alert("Dê um nome e adicione pelo menos um item.");
            return;
        }

        const token = localStorage.getItem('custos_token');
        if (!token) {
            alert("Sessão inválida. Por favor, logue novamente.");
            return;
        }

        try {
            const payload = { id: editingId, nome: novoNome, itens: listaItensTemp };
            await axios.post('/api/presets', payload, { headers: { Authorization: `Bearer ${token}` } });
            await carregarApi();
            cancelarEdicao();
        } catch (e) {
            alert('Falha ao salvar modelo na nuvem!');
        }
    };

    const deletarPreset = async (id) => {
        if (window.confirm("Excluir este modelo permanentemente da nuvem?")) {
            const token = localStorage.getItem('custos_token');
            if(!token) return;
            try {
               await axios.delete(`/api/presets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
               await carregarApi();
            } catch(e) {
               alert('Erro ao excluir modelo');
            }
        }
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                {/* HEADER */}
                <div className={styles['modal-header']}>
                    <h2>Gerenciar Modelos</h2>
                    <button onClick={onClose} className={styles['btn-close-icon']}>
                        <Icons.Close />
                    </button>
                </div>

                {/* TABS */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('list'); setEditingId(null); }}
                    >
                        Meus Modelos
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('create'); setEditingId(null); setNovoNome(''); setListaItensTemp([]); }}
                    >
                        {editingId ? 'Editar Modelo' : 'Novo Modelo'}
                    </button>
                </div>

                {/* LISTA VIEW */}
                {activeTab === 'list' && (
                    <div className={styles['preset-list']}>
                        {presets.length === 0 ? (
                            <div style={{textAlign:'center', padding: '40px 0', color:'#94a3b8'}}>
                                <p>Nenhum modelo encontrado.</p>
                                <small>Crie um modelo para agilizar seus cálculos.</small>
                            </div>
                        ) : (
                            presets.map(preset => (
                                <div key={preset.id} className={styles['preset-item']}>
                                    <div>
                                        <div style={{fontWeight: 'bold', color: '#1e293b'}}>{preset.nome}</div>
                                        <div style={{fontSize: '0.85rem', color: '#64748b'}}>
                                            {preset.itens.length} características cadastradas
                                        </div>
                                    </div>
                                    <div className={styles['action-buttons']}>
                                        <button onClick={() => iniciarEdicao(preset)} className={`${styles['icon-btn']} ${styles.edit}`} title="Editar">
                                            <Icons.Edit />
                                        </button>
                                        <button onClick={() => deletarPreset(preset.id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Excluir">
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CREATE/EDIT VIEW */}
                {activeTab === 'create' && (
                    <div className={styles['create-area']}>
                        {editingId && (
                            <div className={styles['editing-banner']}>
                                <Icons.Edit /> Editando: <strong>{presets.find(p => p.id === editingId)?.nome}</strong>
                            </div>
                        )}

                        <div>
                            <label className={styles['modal-label']}>Nome do Modelo</label>
                            <input
                                type="text"
                                className={styles['modal-input']}
                                value={novoNome}
                                onChange={(e) => setNovoNome(e.target.value)}
                                placeholder="Ex: Sandália Rasteira 2024"
                            />
                        </div>

                        <div>
                            <label className={styles['modal-label']}>Adicionar Características</label>
                            <form onSubmit={adicionarItemTemp} className={styles['add-item-row']}>
                                <input
                                    type="text"
                                    className={styles['modal-input']}
                                    value={novoItem}
                                    onChange={(e) => setNovoItem(e.target.value)}
                                    placeholder="Ex: Sola, Palmilha, Fivela..."
                                />
                                <button type="submit" className={styles['btn-icon-add']} title="Adicionar">
                                    <Icons.Plus />
                                </button>
                            </form>
                        </div>

                        <div className={styles['tag-container']}>
                            {listaItensTemp.length === 0 && <span style={{color:'#cbd5e1', fontStyle:'italic', margin: 'auto'}}>Itens adicionados aparecerão aqui...</span>}
                            {listaItensTemp.map((item, idx) => (
                                <span key={idx} className={styles.tag}>
                                    {item}
                                    <span className={styles['tag-remove']} onClick={() => removerItemTemp(idx)}>
                                        <Icons.Close />
                                    </span>
                                </span>
                            ))}
                        </div>

                        <div className={styles['footer-buttons']}>
                            {editingId && (
                                <button onClick={cancelarEdicao} className={`${styles['btn-modal']} ${styles['btn-secondary']}`}>
                                    Cancelar
                                </button>
                            )}
                            <button onClick={salvarPreset} className={`${styles['btn-modal']} ${styles['btn-primary']}`}>
                                {editingId ? 'Salvar Alterações' : 'Criar Modelo'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}