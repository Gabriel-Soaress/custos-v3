import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/Reversa.module.css';
// CORREÇÃO: Importamos o DEFAULTS agora
import { MARKETPLACES_DEFAULTS, CONFIG_GLOBAL } from '../config/taxas';
import { SettingsIcon } from '../components/Icons';

export default function CalculadoraReversa() {
    // --- ESTADOS DE DADOS ---
    const [precoVenda, setPrecoVenda] = useState('');
    const [custoProducao, setCustoProducao] = useState('');
    const [temLucroEmbutido, setTemLucroEmbutido] = useState(true);
    const [lucroEmbutido, setLucroEmbutido] = useState('');

    // --- ESTADOS DE CONFIGURAÇÃO (LÓGICA NOVA) ---
    // Começa com uma lista vazia ou padrão
    const [marketplaces, setMarketplaces] = useState(MARKETPLACES_DEFAULTS);
    const [selectedMktId, setSelectedMktId] = useState(MARKETPLACES_DEFAULTS[0].id);

    // Modal de Taxas
    const [showConfig, setShowConfig] = useState(false);
    const [configTemp, setConfigTemp] = useState([]);

    // Checkboxes
    const [checks, setChecks] = useState({
        comissao: true, fixa: true, ads: false, extra: true, imposto: true
    });

    const [resultado, setResultado] = useState(null);

    const toFloat = (val) => {
        if (!val) return 0;
        return parseFloat(val.toString().replace(',', '.'));
    };

    const abrirConfig = () => {
        const configParaEditar = marketplaces.map(m => ({
            ...m,
            unidadeAds: m.unidadeAds || '%',
            unidadeExtra: m.unidadeExtra || '%',
            unidadeImposto: m.unidadeImposto || '%',
            taxaComissao: ((m.taxaComissao || 0) * 100).toString().replace('.', ','),
            taxaFixa: (m.taxaFixa || 0).toString().replace('.', ','),
            taxaAds: m.unidadeAds === 'R$' ? (m.taxaAds || 0).toString().replace('.', ',') : ((m.taxaAds || 0) * 100).toString().replace('.', ','),
            taxaExtra: m.unidadeExtra === 'R$' ? (m.taxaExtra || 0).toString().replace('.', ',') : ((m.taxaExtra || 0) * 100).toString().replace('.', ','),
            imposto: m.unidadeImposto === 'R$' ? (m.imposto || 0).toString().replace('.', ',') : ((m.imposto || 0) * 100).toString().replace('.', ',')
        }));
        setConfigTemp(configParaEditar);
        setShowConfig(true);
    };

    const atualizarConfigTemp = (id, campo, valor) => {
        const novos = configTemp.map(m => {
            if (m.id === id) return { ...m, [campo]: valor };
            return m;
        });
        setConfigTemp(novos);
    };

    const restaurarPadrao = (id) => {
        if (!window.confirm("Restaurar taxas originais desta loja?")) return;
        const padrao = MARKETPLACES_DEFAULTS.find(d => d.id === id);
        if (!padrao) return;

        const novos = configTemp.map(m => {
            if (m.id === id) {
                return {
                    ...padrao,
                    unidadeAds: padrao.unidadeAds || '%',
                    unidadeExtra: padrao.unidadeExtra || '%',
                    unidadeImposto: padrao.unidadeImposto || '%',
                    taxaComissao: ((padrao.taxaComissao || 0) * 100).toString().replace('.', ','),
                    taxaFixa: (padrao.taxaFixa || 0).toString().replace('.', ','),
                    taxaAds: padrao.unidadeAds === 'R$' ? (padrao.taxaAds || 0).toString().replace('.', ',') : ((padrao.taxaAds || 0) * 100).toString().replace('.', ','),
                    taxaExtra: padrao.unidadeExtra === 'R$' ? (padrao.taxaExtra || 0).toString().replace('.', ',') : ((padrao.taxaExtra || 0) * 100).toString().replace('.', ','),
                    imposto: padrao.unidadeImposto === 'R$' ? (padrao.imposto || 0).toString().replace('.', ',') : ((padrao.imposto || 0) * 100).toString().replace('.', ',')
                };
            }
            return m;
        });
        setConfigTemp(novos);
    };

    const salvarConfiguracoes = async () => {
        const finalConfig = configTemp.map(m => {
            const vComissao = toFloat(m.taxaComissao);
            const vFixa = toFloat(m.taxaFixa);
            const vAds = toFloat(m.taxaAds);
            const vExtra = toFloat(m.taxaExtra);
            const vImp = toFloat(m.imposto);

            return {
                ...m,
                taxaComissao: vComissao / 100,
                taxaFixa: vFixa,
                taxaAds: m.unidadeAds === '%' ? vAds / 100 : vAds,
                taxaExtra: m.unidadeExtra === '%' ? vExtra / 100 : vExtra,
                imposto: m.unidadeImposto === '%' ? vImp / 100 : vImp
            };
        });

        const token = localStorage.getItem('custos_token');
        if (token) {
            try {
                await axios.post(`${API_BASE_URL}/api/marketplaces`, finalConfig, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Erro ao salvar", err);
                alert("Falha ao sincronizar com o banco de dados remoto.");
            }
        }

        setMarketplaces(finalConfig);
        setShowConfig(false);
    };

    // EFEITO: Carregar as taxas personalizadas logadas e salvar cache
    useEffect(() => {
        const fetchMarketplaces = async () => {
            const token = localStorage.getItem('custos_token');
            if (token) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/marketplaces`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && res.data.length > 0) {
                        setMarketplaces(res.data);
                        if (!res.data.find(m => String(m.id) === String(selectedMktId))) {
                            setSelectedMktId(res.data[0].id);
                        }
                    }
                } catch (err) { }
            }
        };
        fetchMarketplaces();
    }, []);

    const handleMktChange = (e) => { setSelectedMktId(e.target.value); };

    // Pega a loja da lista atual (que pode ser a personalizada)
    // USAMOS == para comparar Number com String (e.target.value)
    const currentMkt = marketplaces.find(m => String(m.id) === String(selectedMktId)) || marketplaces[0];

    // --- CÁLCULO (Mantido igual) ---
    const calcular = () => {
        const venda = parseFloat(precoVenda);
        const custoTotal = parseFloat(custoProducao);
        const lucroEmb = temLucroEmbutido ? (parseFloat(lucroEmbutido) || 0) : 0;

        if (isNaN(venda) || isNaN(custoTotal)) return window.alert("Preencha os valores.");

        let totalDescontos = 0;
        const detalhes = [];

        if (checks.comissao) {
            const val = venda * (currentMkt.taxaComissao || 0);
            totalDescontos += val;
            detalhes.push({ nome: `Comissão (${((currentMkt.taxaComissao || 0)*100).toFixed(1)}%)`, valor: val });
        }
        if (checks.fixa && (currentMkt.taxaFixa || 0) > 0) {
            totalDescontos += (currentMkt.taxaFixa || 0);
            detalhes.push({ nome: `Taxa Fixa`, valor: currentMkt.taxaFixa });
        }
        if (checks.ads && (currentMkt.taxaAds || 0) > 0) {
            const isRS = currentMkt.unidadeAds === 'R$';
            const val = isRS ? currentMkt.taxaAds : (venda * currentMkt.taxaAds);
            totalDescontos += val;
            detalhes.push({ nome: `Ads (${isRS ? 'R$ '+currentMkt.taxaAds.toFixed(2) : (currentMkt.taxaAds*100).toFixed(1)+'%'})`, valor: val });
        }
        if (checks.extra && (currentMkt.taxaExtra || 0) > 0) {
            const isRS = currentMkt.unidadeExtra === 'R$';
            const val = isRS ? currentMkt.taxaExtra : (venda * currentMkt.taxaExtra);
            totalDescontos += val;
            detalhes.push({ nome: `Taxa Extra (${isRS ? 'R$ '+currentMkt.taxaExtra.toFixed(2) : (currentMkt.taxaExtra*100).toFixed(1)+'%'})`, valor: val });
        }
        if (checks.imposto) {
            const mktImposto = currentMkt.imposto !== undefined ? currentMkt.imposto : CONFIG_GLOBAL.imposto;
            const isRS = currentMkt.unidadeImposto === 'R$';
            const val = isRS ? mktImposto : (venda * mktImposto);
            totalDescontos += val;
            detalhes.push({ nome: `Imposto (${isRS ? 'R$ '+mktImposto.toFixed(2) : (mktImposto*100).toFixed(1)+'%'})`, valor: val });
        }

        const liquidoVenda = venda - totalDescontos;
        const custoMaterialReal = custoTotal - lucroEmb;
        const sobraFinal = liquidoVenda - custoMaterialReal;

        setResultado({ venda, totalDescontos, detalhes, liquidoVenda, custoMaterialReal, lucroEmb, sobraFinal });
        setTimeout(() => document.getElementById('res-reversa')?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const limpar = () => { setPrecoVenda(''); setCustoProducao(''); setLucroEmbutido(''); setResultado(null); };

    const getStatusColor = () => {
        if (!resultado) return {};
        if (resultado.sobraFinal < 0) return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
        if (resultado.sobraFinal < (resultado.lucroEmb || 5)) return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
    };
    const statusStyle = getStatusColor();

    return (
        <div className={styles.body}>
            <nav className={`${styles.navbar} ${styles['no-print']}`}>
                <div className={styles.logoArea}>
                    <h1 className={styles.logoText}>Controle<span>Reversa</span></h1>
                </div>
                <div className={styles.navActions}>
                    <button onClick={abrirConfig} className={styles.btnNavIcon} title="Configurar Taxas" style={{border: '1px solid #cbd5e1', padding: 0}}>
                        <SettingsIcon />
                    </button>
                    <Link to="/dashboard" className={styles.btnNavIcon} title="Voltar para Central">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'20px', height:'20px'}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </Link>
                </div>
            </nav>

            <div className={styles.container}>

                <div className={`${styles['marketplace-selector']} ${styles['no-print']}`}>
                    <label className={styles['label-select']}>Onde você vai vender?</label>
                    <select className={styles['select-mkt']} value={selectedMktId} onChange={handleMktChange}>
                        {marketplaces.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                    </select>
                </div>

                <div className={styles['form-group']}>
                    <label className={styles.label}>Por quanto quer vender?</label>
                    <input type="number" className={styles.input} placeholder="Ex: 59.90" value={precoVenda} onChange={e => setPrecoVenda(e.target.value)} />
                </div>

                <div className={styles['form-group']}>
                    <label className={styles.label}>Qual seu Custo de Produção Total?</label>
                    <input type="number" className={styles.input} placeholder="Ex: 25.00" value={custoProducao} onChange={e => setCustoProducao(e.target.value)} />
                </div>

                <div className={`${styles['embedded-profit-area']} ${styles['no-print']}`}>
                    <div className={styles['embedded-header']} onClick={() => setTemLucroEmbutido(!temLucroEmbutido)}>
                        <input type="checkbox" checked={temLucroEmbutido} readOnly style={{accentColor: '#10b981', width:'18px', height:'18px'}} />
                        <span style={{fontWeight:'600', color:'#065f46'}}>Tem lucro incluso nesse custo?</span>
                    </div>
                    {temLucroEmbutido && (
                        <input type="number" className={styles.input} style={{borderColor: '#10b981'}} placeholder="Quanto é lucro? Ex: 5.00" value={lucroEmbutido} onChange={e => setLucroEmbutido(e.target.value)} />
                    )}
                </div>

                <div className={`${styles['taxas-area']} ${styles['no-print']}`}>
                    <div className={styles['taxas-title']}>Descontos Ativos ({currentMkt.nome})</div>
                    
                    {(currentMkt.taxaComissao || 0) > 0 && (
                        <div className={styles['checkbox-row']}>
                            <label className={styles['checkbox-label']}>
                                <input type="checkbox" className={styles['checkbox-input']} checked={checks.comissao} onChange={e => setChecks({...checks, comissao: e.target.checked})} />
                                Comissão ({((currentMkt.taxaComissao || 0) * 100).toFixed(1)}%)
                            </label>
                        </div>
                    )}
                    
                    {(currentMkt.taxaFixa || 0) > 0 && (
                        <div className={styles['checkbox-row']}>
                            <label className={styles['checkbox-label']}>
                                <input type="checkbox" className={styles['checkbox-input']} checked={checks.fixa} onChange={e => setChecks({...checks, fixa: e.target.checked})} /> 
                                Taxa Fixa (R$ {(currentMkt.taxaFixa || 0).toFixed(2)})
                            </label>
                        </div>
                    )}
                    
                    {(currentMkt.taxaAds || 0) > 0 && (
                        <div className={styles['checkbox-row']}>
                            <label className={styles['checkbox-label']}>
                                <input type="checkbox" className={styles['checkbox-input']} checked={checks.ads} onChange={e => setChecks({...checks, ads: e.target.checked})} /> 
                                Ads ({currentMkt.unidadeAds === 'R$' ? 'R$ '+ (currentMkt.taxaAds || 0).toFixed(2) : ((currentMkt.taxaAds || 0) * 100).toFixed(1) + '%'})
                            </label>
                        </div>
                    )}
                    
                    {(currentMkt.taxaExtra || 0) > 0 && (
                        <div className={styles['checkbox-row']}>
                            <label className={styles['checkbox-label']}>
                                <input type="checkbox" className={styles['checkbox-input']} checked={checks.extra} onChange={e => setChecks({...checks, extra: e.target.checked})} /> 
                                Taxa Extra ({currentMkt.unidadeExtra === 'R$' ? 'R$ '+ (currentMkt.taxaExtra || 0).toFixed(2) : ((currentMkt.taxaExtra || 0) * 100).toFixed(1) + '%'})
                            </label>
                        </div>
                    )}
                    
                    {(currentMkt.imposto !== undefined ? currentMkt.imposto : CONFIG_GLOBAL.imposto) > 0 && (
                        <div className={styles['checkbox-row']}>
                            <label className={styles['checkbox-label']}>
                                <input type="checkbox" className={styles['checkbox-input']} checked={checks.imposto} onChange={e => setChecks({...checks, imposto: e.target.checked})} /> 
                                Imposto ({currentMkt.unidadeImposto === 'R$' ? 'R$ '+ (Number(currentMkt.imposto || 0)).toFixed(2) : ((Number(currentMkt.imposto !== undefined ? currentMkt.imposto : CONFIG_GLOBAL.imposto)) * 100).toFixed(1) + '%'})
                            </label>
                        </div>
                    )}
                </div>

                <button onClick={calcular} className={`${styles['btn-calc']} ${styles['no-print']}`}>Ver Lucro Real</button>
                <button onClick={limpar} className={`${styles['btn-clear']} ${styles['no-print']}`}>Limpar</button>

                {resultado && (
                    <div id="res-reversa" className={styles.resultado}>
                        <div style={{textAlign:'center', marginBottom:15}}><h2 style={{margin:0, color: statusStyle.text}}>Análise: {currentMkt.nome}</h2></div>
                        <div className={styles['res-line']}><span>Venda:</span><strong>R$ {resultado.venda.toFixed(2)}</strong></div>
                        <div className={styles['res-divider']}></div>
                        {resultado.detalhes.map((d, i) => (<div key={i} className={styles['res-line']}><span style={{color:'#64748b'}}>(-) {d.nome}</span><span className={styles['red-text']}>- R$ {d.valor.toFixed(2)}</span></div>))}
                        <div className={styles['res-line']} style={{marginTop: 10, fontWeight:'bold'}}><span>(=) Recebido:</span><span>R$ {resultado.liquidoVenda.toFixed(2)}</span></div>
                        <div className={styles['res-divider']}></div>
                        <div className={styles['res-line']}><span>(-) Custo Real:</span><span className={styles['red-text']}>- R$ {resultado.custoMaterialReal.toFixed(2)}</span></div>
                        <div className={styles['final-card']} style={{backgroundColor: statusStyle.bg, borderColor: statusStyle.border, color: statusStyle.text}}><span className={styles['final-label']}>Sobra Real:</span><span className={styles['final-value']}>R$ {resultado.sobraFinal.toFixed(2)}</span></div>
                    </div>
                )}
            </div>

            {/* --- MODAL DE CONFIGURAÇÃO --- */}
            {showConfig && (
                <div className={styles['modal-overlay']}>
                    <div className={styles['modal-content']}>
                        <div className={styles['modal-header']}>
                            <h3>Configurar Taxas das Lojas</h3>
                            <button onClick={() => setShowConfig(false)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.5rem'}}>&times;</button>
                        </div>

                        <div className={styles['modal-body']}>
                            {configTemp.map((mkt) => (
                                <div key={mkt.id} className={styles['config-item']}>
                                    <div className={styles['config-row-top']}>
                                        <span className={styles['store-name']}>
                                            <span className={styles['color-dot']} style={{backgroundColor: mkt.cor}}></span>
                                            {mkt.nome}
                                        </span>
                                        <button onClick={() => restaurarPadrao(mkt.id)} className={styles['btn-restore']}>
                                            Restaurar Padrão
                                        </button>
                                    </div>

                                    <div className={styles['inputs-grid']}>
                                        <div className={styles['input-group']}>
                                            <label className={styles['label-cfg']}>Comissão</label>
                                            <div className={styles['input-joined-wrapper']}>
                                                <span className={styles['joined-select']} style={{cursor:'default'}}>%</span>
                                                <input
                                                    type="text" inputMode="decimal" className={styles['joined-input']}
                                                    value={mkt.taxaComissao}
                                                    onChange={e => atualizarConfigTemp(mkt.id, 'taxaComissao', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles['input-group']}>
                                            <label className={styles['label-cfg']}>Taxa Fixa</label>
                                            <div className={styles['input-joined-wrapper']}>
                                                <span className={styles['joined-select']} style={{cursor:'default'}}>R$</span>
                                                <input
                                                    type="text" inputMode="decimal" className={styles['joined-input']}
                                                    value={mkt.taxaFixa}
                                                    onChange={e => atualizarConfigTemp(mkt.id, 'taxaFixa', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles['input-group']}>
                                            <label className={styles['label-cfg']}>Ads / Mkt</label>
                                            <div className={styles['input-joined-wrapper']}>
                                                <select className={styles['joined-select']} value={mkt.unidadeAds} onChange={e => atualizarConfigTemp(mkt.id, 'unidadeAds', e.target.value)}>
                                                    <option value="%">%</option>
                                                    <option value="R$">R$</option>
                                                </select>
                                                <input
                                                    type="text" inputMode="decimal" className={styles['joined-input']}
                                                    value={mkt.taxaAds}
                                                    onChange={e => atualizarConfigTemp(mkt.id, 'taxaAds', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles['input-group']}>
                                            <label className={styles['label-cfg']}>Taxa Extra</label>
                                            <div className={styles['input-joined-wrapper']}>
                                                <select className={styles['joined-select']} value={mkt.unidadeExtra} onChange={e => atualizarConfigTemp(mkt.id, 'unidadeExtra', e.target.value)}>
                                                    <option value="%">%</option>
                                                    <option value="R$">R$</option>
                                                </select>
                                                <input
                                                    type="text" inputMode="decimal" className={styles['joined-input']}
                                                    value={mkt.taxaExtra}
                                                    onChange={e => atualizarConfigTemp(mkt.id, 'taxaExtra', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles['input-group']}>
                                            <label className={styles['label-cfg']}>Imposto</label>
                                            <div className={styles['input-joined-wrapper']}>
                                                <select className={styles['joined-select']} value={mkt.unidadeImposto} onChange={e => atualizarConfigTemp(mkt.id, 'unidadeImposto', e.target.value)}>
                                                    <option value="%">%</option>
                                                    <option value="R$">R$</option>
                                                </select>
                                                <input
                                                    type="text" inputMode="decimal" className={styles['joined-input']}
                                                    value={mkt.imposto}
                                                    onChange={e => atualizarConfigTemp(mkt.id, 'imposto', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles['modal-footer']}>
                            <button onClick={() => setShowConfig(false)} className={styles['btn-cancel']}>Cancelar</button>
                            <button onClick={salvarConfiguracoes} className={styles['btn-save']}>Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}