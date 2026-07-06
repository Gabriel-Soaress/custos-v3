import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/VendaDireta.module.css';
import ModalPresets from '../components/ModalPresets';
import ModalProdutos from '../components/ModalProdutos';

// Ícones SVG
const Icons = {
    ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
    Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    Calc: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>,
    Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    Print: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    CloudDownload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 12v7"/><path d="m9 16 3 3 3-3"/></svg>,
    CloudUpload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 19v-7"/><path d="m9 15 3-3 3 3"/></svg>,
    Box: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    Money: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="8" x2="8" y1="15" y2="15"/><line x1="12" x2="16" y1="15" y2="15"/></svg>
};

export default function VendaDireta() {
    const fileInputRef = useRef(null);
    const [nomeProduto, setNomeProduto] = useState('');
    const [itens, setItens] = useState([{ nome: 'LUCRO', valor: '', fixo: false, unidade: 'R$', categoria: 'lucro' }]);

    // IMPOSTO: Estado local (para editar na tela), futuramente vindo do banco
    const [imposto, setImposto] = useState(6);

    const [resultado, setResultado] = useState(null);
    const [presets, setPresets] = useState([]);
    const [presetSelecionado, setPresetSelecionado] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showModalProdutos, setShowModalProdutos] = useState(false);
    const [produtoId, setProdutoId] = useState(null); // ID do produto carregado da nuvem

    useEffect(() => {
        carregarPresetsDoStorage();
        const sN = localStorage.getItem('dir_nome');
        const sI = JSON.parse(localStorage.getItem('dir_itens'));
        const sImp = localStorage.getItem('dir_imposto'); // Salva imposto tb

        if (sN) setNomeProduto(sN);
        if (sI && sI.length > 0) setItens(sI);
        if (sImp) setImposto(parseFloat(sImp));
    }, []);

    useEffect(() => {
        localStorage.setItem('dir_nome', nomeProduto);
        localStorage.setItem('dir_itens', JSON.stringify(itens));
        localStorage.setItem('dir_imposto', imposto);
    }, [nomeProduto, itens, imposto]);

    const carregarPresetsDoStorage = async () => { 
        const token = localStorage.getItem('custos_token');
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/presets`, { headers: { Authorization: `Bearer ${token}` } });
            setPresets(res.data);
        } catch(e) {
            const salvos = JSON.parse(localStorage.getItem('user_presets') || '[]'); 
            setPresets(salvos); 
        }
    };

    const salvarProdutoNuvem = async (isCopy = false) => {
        if (!nomeProduto) return alert("Dê um nome ao produto primeiro!");
        const token = localStorage.getItem('custos_token');
        if (!token) return alert("Sessão inválida!");

        const payload = {
            nome: nomeProduto,
            imposto: parseFloat(imposto),
            itens: itens
        };

        // Se não for cópia e tivermos um ID, enviamos para atualizar
        if (!isCopy && produtoId) {
            payload.id = produtoId;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/produtos`, payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            if (!isCopy && res.data.id) {
                setProdutoId(res.data.id);
            }
            
            alert(isCopy ? "Cópia salva na nuvem com sucesso!" : "Produto salvo na nuvem com sucesso!");
        } catch(e) { 
            console.error("Erro ao salvar:", e);
            const msg = e.response?.data?.error || "Erro desconhecido ao salvar.";
            alert(`Erro ao salvar produto na nuvem: ${msg}`);
        }
    };

    const carregarProdutoNuvem = (prod) => {
        if (window.confirm(`Carregar o produto ${prod.nome}? Todos os dados atuais das planilhas serão apagados.`)) {
            setProdutoId(prod.id);
            setNomeProduto(prod.nome);
            setImposto(prod.imposto);
            setItens(prod.itens);
            setResultado(null);
            setShowModalProdutos(false);
        }
    };

    const selecionarPreset = (e) => {
        const id = e.target.value; setPresetSelecionado(id); if (!id) return;
        const modelo = presets.find(p => p.id.toString() === id);
        if (modelo) {
            if (itens.length > 1 && !window.confirm("Substituir itens atuais?")) return;
            const novos = modelo.itens.map(n => ({ 
                nome: n.nome, 
                valor: n.valor_padrao > 0 ? n.valor_padrao : '', 
                fixo: false, 
                unidade: 'R$',
                categoria: n.categoria || 'materia_prima'
            }));
            novos.push({ nome: 'LUCRO', valor: '', fixo: false, unidade: 'R$', categoria: 'lucro' });
            setItens(novos); setResultado(null);
        }
    };

    const atualizarValor = (i, v) => { const n = [...itens]; n[i].valor = v; setItens(n); };
    const atualizarNome = (i, v) => { const n = [...itens]; n[i].nome = v; setItens(n); };
    const atualizarUnidade = (i, u) => { const n = [...itens]; n[i].unidade = u; setItens(n); };
    const atualizarCategoria = (i, c) => { const n = [...itens]; n[i].categoria = c; setItens(n); };
    const addItem = () => { setItens([...itens, { nome: '', valor: '', fixo: false, unidade: 'R$', categoria: 'materia_prima' }]); };
    const rmItem = (i) => { const n = [...itens]; n.splice(i, 1); setItens(n); };
    const limpar = () => { if (window.confirm("Zerar tudo?")) { setProdutoId(null); setNomeProduto(''); setItens([{nome:'LUCRO',valor:'',fixo:false,unidade:'R$', categoria:'lucro'}]); setResultado(null); setPresetSelecionado(''); }};

    // --- CÁLCULO ATUALIZADO ---
    const calcular = () => {
        let somaBaseReais = 0;
        const itensParaProcessar = [];

        // 1. Somar Reais
        itens.forEach(i => {
            const val = parseFloat(i.valor);
            if (!isNaN(val) && val > 0 && i.unidade === 'R$') {
                somaBaseReais += val;
            }
            if (!isNaN(val) && val > 0) {
                itensParaProcessar.push({ ...i, valorInput: val });
            }
        });

        // 2. Calcular % e Totais
        const itensDetalhados = [];
        let somaTotal = 0;
        let somaSemLucro = 0;

        itensParaProcessar.forEach(item => {
            let valorFinal = 0;
            if (item.unidade === '%') {
                valorFinal = somaBaseReais * (item.valorInput / 100);
            } else {
                valorFinal = item.valorInput;
            }
            somaTotal += valorFinal;
            if (item.nome !== 'LUCRO') {
                somaSemLucro += valorFinal;
            }
            itensDetalhados.push({
                nome: item.nome,
                valor: valorFinal,
                destaque: item.nome === 'LUCRO',
                // Guardamos a unidade original para exibir corretamente se quiser
                unidadeOriginal: item.unidade
            });
        });

        if (somaTotal === 0) return window.alert("Preencha algum valor!");

        // CÁLCULO COM IMPOSTO EDITÁVEL
        const fatorImposto = (100 - imposto) / 100;
        const comNota = somaTotal / fatorImposto;

        setResultado({
            semNota: somaTotal,
            comNota: comNota,
            custoProducao: somaSemLucro,
            impostoDisplay: imposto, // Passa o valor do state
            itensValidos: itensDetalhados,
            data: new Date().toLocaleString('pt-BR')
        });
    };

    const exportar = () => { const d = {nome:nomeProduto,itens,imposto}; const b = new Blob([JSON.stringify(d,null,2)],{type:"application/json"}); const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download=(nomeProduto||"prod")+".json"; l.click(); };
    const importar = (e) => { const f = e.target.files[0]; if(!f)return; const r = new FileReader(); r.onload=(ev)=>{try{const d=JSON.parse(ev.target.result);if(window.confirm("Carregar?")){setNomeProduto(d.nome||"");const i=(d.itens||[]).map(x=>({...x,unidade:x.unidade||'R$'}));setItens(i);if(d.imposto) setImposto(d.imposto);setResultado(null);}}catch(er){alert("Erro");}}; r.readAsText(f); e.target.value=""; };

    return (
        <div className={styles.body}>
            <nav className={`${styles.navbar} ${styles['no-print']}`}>
                <div className={styles.logoArea}>
                    <h1 className={styles.logoText}>Controle<span>Direta</span></h1>
                </div>
                <div className={styles.navActions}>
                    <Link to="/dashboard" className={styles.btnNavIcon} title="Voltar para Central">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'20px', height:'20px'}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </Link>
                </div>
            </nav>

            <div className={styles['container-erp']}>
                <h2 className={`${styles['print-title']} ${styles['only-print']}`}>{nomeProduto || "Produto Sem Nome"}</h2>
                <div className={styles['erp-grid']}>

                    <div className={styles['left-column']}>
                        {/* --- BARRA DE CONFIGURAÇÃO ATUALIZADA --- */}
                        <div className={`${styles['config-bar']} ${styles['no-print']}`}>
                            <div className={styles['presetsGroup']}>
                                <select className={styles['select-preset']} value={presetSelecionado} onChange={selecionarPreset}>
                                    <option value="">Carregar Modelo...</option>
                                    {presets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                                <button onClick={() => setShowModal(true)} className={styles['btn-mini']} title="Gerenciar Modelos"><Icons.Settings /> Modelos</button>
                            </div>

                            <div className={styles['v-separator']}></div>

                            <div className={styles['taxGroup']} title="Configurar Imposto (Nota Fiscal)">
                                <div className={styles['tax-control-group']}>
                                    <span className={styles['tax-label']}>Nota:</span>
                                    <input
                                        type="number"
                                        className={styles['input-tax-header']}
                                        value={imposto}
                                        onChange={(e) => setImposto(e.target.value)}
                                    />
                                    <span style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>%</span>
                                </div>
                            </div>

                            <div className={styles['v-separator']}></div>
                            
                            <div className={styles['cloudGroup']}>
                                <button onClick={() => setShowModalProdutos(true)} className={`${styles['btn-mini']} ${styles['btn-cloud-load']}`} title="Abrir da Nuvem">
                                    <Icons.CloudDownload /> Meus Produtos
                                </button>
                                {produtoId ? (
                                    <div className={styles['save-options']}>
                                        <button onClick={() => salvarProdutoNuvem(false)} className={`${styles['btn-mini']} ${styles['btn-save-cloud']}`} title="Salvar Alterações">
                                            <Icons.CloudUpload /> Salvar
                                        </button>
                                        <button onClick={() => salvarProdutoNuvem(true)} className={`${styles['btn-mini']} ${styles['btn-copy-cloud']}`} title="Salvar uma Cópia">
                                            <Icons.Plus /> Cópia
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => salvarProdutoNuvem(false)} className={`${styles['btn-mini']} ${styles['btn-cloud-save']}`} title="Salvar na Nuvem">
                                        <Icons.CloudUpload /> Salvar na Nuvem
                                    </button>
                                )}
                            </div>

                            <div className={styles['v-separator']}></div>

                            <div className={styles['fileGroup']}>
                                <button onClick={() => fileInputRef.current.click()} className={styles['btn-mini']}><Icons.Upload /> Abrir</button>
                                <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".json" onChange={importar} />
                                <button onClick={exportar} className={styles['btn-mini']}><Icons.Download /> Salvar</button>
                            </div>
                        </div>

                        <div className={styles['card-panel']}>
                            <div className={styles['section-title']}><Icons.Box /> Detalhes do Produto</div>

                            <input type="text" className={styles['input-produto-lg']} placeholder="Nome do Produto" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} />

                            <div className={styles['items-list']}>
                                {itens.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', padding:20}}>Lista vazia</div>}

                                {itens.map((item, index) => {
                                    const isEmpty = !item.nome && !item.valor;
                                    return (
                                        <div key={index} className={`${styles['item-row']} ${styles['item-' + (item.categoria || 'materia_prima')]} ${isEmpty ? styles['print-hidden'] : ''}`}>
                                            <input 
                                                className={styles['input-text-clean']} 
                                                placeholder="Nome do Item" 
                                                value={item.nome} 
                                                onChange={e => atualizarNome(index, e.target.value)} 
                                                style={item.nome === 'LUCRO' ? {color:'#10b981', fontWeight:'bold'} : {}} 
                                            />

                                            <select 
                                                className={`${styles['select-categoria']} ${styles['no-print']}`}
                                                value={item.categoria || 'materia_prima'} 
                                                onChange={(e) => atualizarCategoria(index, e.target.value)}
                                                disabled={item.nome === 'LUCRO'}
                                            >
                                                <option value="materia_prima">Matéria Prima</option>
                                                <option value="mao_de_obra">Mão de Obra</option>
                                                <option value="embalagem">Embalagem</option>
                                                <option value="lucro">Lucro / Taxas</option>
                                            </select>

                                            <div className={styles['input-joined-wrapper']}>
                                                <select className={styles['joined-select']} value={item.unidade} onChange={(e) => atualizarUnidade(index, e.target.value)} tabIndex={-1}>
                                                    <option value="R$">R$</option>
                                                    <option value="%">%</option>
                                                </select>
                                                <input type="number" className={styles['joined-input']} value={item.valor} onChange={e => atualizarValor(index, e.target.value)} placeholder="0,00" />
                                            </div>

                                            <button onClick={() => rmItem(index)} className={`${styles['btn-icon-remove']} ${styles['no-print']}`}><Icons.Close /></button>
                                        </div>
                                    );
                                })}

                                <button onClick={addItem} className={`${styles['btn-add-line']} ${styles['no-print']}`}><Icons.Plus /> Adicionar Linha</button>
                            </div>
                        </div>
                    </div>

                    <div className={styles['right-column']}>
                        <div className={styles['sticky-panel']}>
                            <button onClick={calcular} className={`${styles['btn-primary-lg']} ${styles['no-print']}`}><Icons.Calc /> CALCULAR</button>

                            {resultado && (
                                <div className={styles['result-card']}>
                                    <div className={styles['section-title']} style={{border:0, marginTop: '20px'}}><Icons.Money /> Custos Finais</div>
                                    <div className={styles['result-row']}>
                                        <span className={styles['result-label']}>Soma sem Lucro</span>
                                        <span className={styles['result-value']}>R$ {resultado.custoProducao.toFixed(2)}</span>
                                    </div>
                                    <div className={styles['result-row']}>
                                        <span className={styles['result-label']}>Sem Nota</span>
                                        <span className={`${styles['result-value']} ${styles['highlight-green']}`}>R$ {resultado.semNota.toFixed(2)}</span>
                                    </div>
                                    <div className={styles['result-row']}>
                                        <span className={styles['result-label']}>Com Nota ({resultado.impostoDisplay}%)</span>
                                        <span className={styles['result-value']}>R$ {resultado.comNota.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className={`${styles['actions-grid']} ${styles['no-print']}`}>
                                <button onClick={() => window.print()} className={styles['btn-secondary']} disabled={!resultado} style={{opacity: !resultado?0.6:1}}><Icons.Print /> Imprimir</button>
                                <button onClick={limpar} className={styles['btn-danger']}><Icons.Trash /> Limpar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {showModal && <ModalPresets onClose={() => setShowModal(false)} onUpdatePresets={carregarPresetsDoStorage} />}
                {showModalProdutos && <ModalProdutos onClose={() => setShowModalProdutos(false)} onSelectProduto={carregarProdutoNuvem} />}
            </div>
        </div>
    );
}