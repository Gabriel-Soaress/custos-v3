import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/CalculadoraShopee.module.css';
import { MARKETPLACES_DEFAULTS } from '../config/taxas';
import { SettingsIcon, PrintIcon } from '../components/Icons';

const getStoreIcon = (nome, cor) => {
    const n = nome.toLowerCase();
    if (n.includes('shopee')) return <svg viewBox="0 0 24 24" fill={cor} style={{width:'26px', height:'26px'}}><path d="M7 2h10l4 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7l4-5zm0 1.5L4.4 7H19.6L17 3.5H7zM12 10a3 3 0 0 0-3 3v1h2v-1a1 1 0 0 1 2 0v1h2v-1a3 3 0 0 0-3-3z"/></svg>;
    if (n.includes('meli') || n.includes('mercado')) return <svg viewBox="0 0 24 24" fill={cor} style={{width:'26px', height:'26px'}}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
    if (n.includes('shein')) return <svg viewBox="0 0 24 24" fill={cor} style={{width:'26px', height:'26px'}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>;
    if (n.includes('amazon')) return <svg viewBox="0 0 24 24" fill={cor} style={{width:'26px', height:'26px'}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 15.5L6 14l1.5-1.5 3 3L16.5 9 18 10.5l-7.5 7.5z"/></svg>;
    return <svg viewBox="0 0 24 24" fill={cor} style={{width:'26px', height:'26px'}}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-8h-4v2h4v-2zm-6 4H6v2h6v-2zm-6-4h4v2H6v-2z"/></svg>;
};

export default function CalculadoraShopee() {
    const [nomeProduto, setNomeProduto] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');
    const [custoProduto, setCustoProduto] = useState('');
    const [lucroDesejado, setLucroDesejado] = useState('');
    const [resultados, setResultados] = useState([]);

    const [marketplaces, setMarketplaces] = useState([]);
    const [showConfig, setShowConfig] = useState(false);
    const [configTemp, setConfigTemp] = useState([]);

    // Trata valores com vírgula digitados livremente
    const toFloat = (val) => {
        if (!val) return 0;
        return parseFloat(val.toString().replace(',', '.'));
    };

    const navigate = useNavigate();

    useEffect(() => {
        const salvoCalc = JSON.parse(localStorage.getItem('mkt_last_calc'));
        if (salvoCalc) {
            setNomeProduto(salvoCalc.nome || '');
            setPrecoVenda(salvoCalc.venda || '');
            setCustoProduto(salvoCalc.custo || '');
            setLucroDesejado(salvoCalc.lucro || '6.00');
        }

        const fetchMarketplaces = async () => {
            const token = localStorage.getItem('custos_token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/api/marketplaces`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.length > 0) {
                    setMarketplaces(res.data);
                } else {
                    setMarketplaces(MARKETPLACES_DEFAULTS);
                }
            } catch (err) {
                console.error("Erro ao carregar taxas", err);
                if (err.response?.status === 401) navigate('/');
                setMarketplaces(MARKETPLACES_DEFAULTS);
            }
        };
        fetchMarketplaces();
    }, [navigate]);

    const calcular = () => {
        const custo = toFloat(custoProduto);
        const lucro = toFloat(lucroDesejado);

        if (isNaN(custo) || isNaN(lucro) || (custo === 0 && lucro === 0)) {
            alert("Preencha o Custo e o Lucro esperado corretamente.");
            return;
        }

        localStorage.setItem('mkt_last_calc', JSON.stringify({
            nome: nomeProduto, custo: custoProduto, lucro: lucroDesejado
        }));

        const novosCalculos = marketplaces.map(mkt => {
            let sumPorcentagem = mkt.taxaComissao || 0;
            let sumFixa = mkt.taxaFixa || 0;

            if (mkt.unidadeAds === 'R$') sumFixa += (mkt.taxaAds || 0);
            else sumPorcentagem += (mkt.taxaAds || 0);

            if (mkt.unidadeExtra === 'R$') sumFixa += (mkt.taxaExtra || 0);
            else sumPorcentagem += (mkt.taxaExtra || 0);

            if (mkt.unidadeImposto === 'R$') sumFixa += (mkt.imposto || 0);
            else sumPorcentagem += (mkt.imposto || 0);

            const divisor = 1 - sumPorcentagem;
            if (divisor <= 0) return null;

            const precoVenda = (custo + lucro + sumFixa) / divisor;

            return {
                ...mkt,
                precoVenda,
                valores: {
                    comissao: precoVenda * (mkt.taxaComissao || 0),
                    ads: mkt.unidadeAds === 'R$' ? (mkt.taxaAds || 0) : precoVenda * (mkt.taxaAds || 0),
                    extra: mkt.unidadeExtra === 'R$' ? (mkt.taxaExtra || 0) : precoVenda * (mkt.taxaExtra || 0),
                    imposto: mkt.unidadeImposto === 'R$' ? (mkt.imposto || 0) : precoVenda * (mkt.imposto || 0),
                    fixa: mkt.taxaFixa || 0,
                    custo: custo,
                    lucro: lucro
                }
            };
        }).filter(Boolean);

        setResultados(novosCalculos);
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

    return (
        <div className={styles.body}>
            <div className={`${styles['nav-container']} ${styles['no-print']}`}>
                <div className={styles['top-buttons']}>
                    <Link to="/dashboard" className={styles['nav-btn']}>Voltar para Central</Link>
                    <button onClick={abrirConfig} className={styles['btn-config']} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <SettingsIcon /> Configurar Taxas
                    </button>
                </div>
            </div>

            <div className={styles.container}>
                <h1 className={styles.h1}>Precificação Multi-Lojas</h1>

                {/* === AQUI: ADICIONADA A CLASSE NO-PRINT PARA ESCONDER OS INPUTS === */}
                <div className={`${styles['input-area']} ${styles['no-print']}`}>
                    <div className={styles['form-group']} style={{flex: 2}}>
                        <label className={styles.label}>Nome do Produto</label>
                        <input type="text" className={styles.input} placeholder="Ex: Tênis Esportivo"
                               value={nomeProduto} onChange={(e) => setNomeProduto(e.target.value)} />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles.label}>Custo do Produto (R$)</label>
                        <input type="text" inputMode="decimal" className={styles.input} placeholder="0,00"
                               value={custoProduto} onChange={(e) => setCustoProduto(e.target.value)} />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles.label}>Lucro Líquido (R$)</label>
                        <input type="text" inputMode="decimal" className={styles.input} placeholder="0,00"
                               value={lucroDesejado} onChange={(e) => setLucroDesejado(e.target.value)} />
                    </div>
                    <button onClick={calcular} className={styles['btn-calc']}>CALCULAR PREÇOS</button>
                </div>

                {resultados.length > 0 && (
                    <>
                        <div className={styles['print-summary']}>
                            <h2>Relatório: {nomeProduto || "Produto Sem Nome"}</h2>
                            <p>
                                <strong>Custo Original:</strong> R$ {parseFloat(custoProduto.toString().replace(',','.')||0).toFixed(2)} &nbsp;|&nbsp;
                                <strong>Lucro Alvo:</strong> R$ {parseFloat(lucroDesejado.toString().replace(',','.')||0).toFixed(2)}
                            </p>
                            <small>Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</small>
                        </div>

                        <div className={styles['results-grid']}>
                            {resultados.map((res) => (
                                <div key={res.id} className={styles.card} style={{borderTop: `4px solid ${res.cor}`}}>
                                    <div className={styles.cardHeader}>
                                        {getStoreIcon(res.nome, res.cor)}
                                        <span style={{color: '#334155'}}>{res.nome}</span>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <span className={styles['price-label']}>Preço de Venda Sugerido</span>
                                        <div className={styles['price-row']}>
                                            <span className={styles['final-price']}>R$ {res.precoVenda.toFixed(2)}</span>
                                            <div className={styles['info-icon']}>?
                                                <div className={styles.tooltip}>
                                                    <div style={{textAlign: 'center', marginBottom: 10, color: '#94a3b8'}}>Detalhes</div>

                                                    {res.valores.comissao > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Comissão ({(res.taxaComissao*100).toFixed(1)}%)</span>
                                                            <span>- R$ {res.valores.comissao.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {res.valores.fixa > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Taxa Fixa</span>
                                                            <span>- R$ {res.valores.fixa.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {res.valores.ads > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Ads ({res.unidadeAds === 'R$' ? 'R$' : (res.taxaAds*100).toFixed(1)+'%'})</span>
                                                            <span>- R$ {res.valores.ads.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {res.valores.extra > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Extra ({res.unidadeExtra === 'R$' ? 'R$' : (res.taxaExtra*100).toFixed(1)+'%'})</span>
                                                            <span>- R$ {res.valores.extra.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {res.valores.imposto > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Imposto ({res.unidadeImposto === 'R$' ? 'R$' : (res.imposto*100).toFixed(1)+'%'})</span>
                                                            <span>- R$ {res.valores.imposto.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {res.valores.custo > 0 && (
                                                        <div className={styles['detail-row']}>
                                                            <span style={{color: '#fff'}}>Custo Prod.</span>
                                                            <span>- R$ {res.valores.custo.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    <div className={`${styles['detail-row']} ${styles.lucroRow}`}>
                                                        <span style={{color: '#86efac'}}>Lucro Limpo</span>
                                                        <span style={{color: '#86efac'}}>R$ {res.valores.lucro.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* === AQUI: ADICIONADA A CLASSE NO-PRINT PARA ESCONDER O BOTÃO === */}
                        <div style={{textAlign: 'center', marginTop: 40}} className={`${styles['btn-print-wrapper']} ${styles['no-print']}`}>
                            <button onClick={() => window.print()} style={{background: '#334155', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display:'inline-flex', alignItems:'center', gap:'8px', fontSize:'1rem'}}>
                                <PrintIcon /> IMPRIMIR TABELA
                            </button>
                        </div>
                    </>
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