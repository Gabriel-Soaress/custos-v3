import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import styles from '../modules/Reversa.module.css';
// CORREÇÃO: Importamos o DEFAULTS agora
import { MARKETPLACES_DEFAULTS, CONFIG_GLOBAL } from '../config/taxas';

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

    // Checkboxes
    const [checks, setChecks] = useState({
        comissao: true, fixa: true, ads: false, extra: true, imposto: true
    });

    const [resultado, setResultado] = useState(null);

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
            <div className={`${styles['nav-container']} ${styles['no-print']}`}>
                <Link to="/dashboard" className={styles['btn-voltar']}>Voltar para Central</Link>
            </div>

            <div className={styles.container}>
                <h1 className={styles.h1}>Prova Real de Lucro</h1>

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
                    <div className={styles['checkbox-row']}>
                        <label className={styles['checkbox-label']}>
                            <input type="checkbox" className={styles['checkbox-input']} checked={checks.comissao} onChange={e => setChecks({...checks, comissao: e.target.checked})} />
                            Comissão ({((currentMkt.taxaComissao || 0) * 100).toFixed(1)}%)
                        </label>
                    </div>
                    {(currentMkt.taxaFixa || 0) > 0 && <div className={styles['checkbox-row']}><label className={styles['checkbox-label']}><input type="checkbox" className={styles['checkbox-input']} checked={checks.fixa} onChange={e => setChecks({...checks, fixa: e.target.checked})} /> Taxa Fixa (R$ {(currentMkt.taxaFixa || 0).toFixed(2)})</label></div>}
                    <div className={styles['checkbox-row']}>
                        <label className={styles['checkbox-label']}>
                            <input type="checkbox" className={styles['checkbox-input']} checked={checks.ads} onChange={e => setChecks({...checks, ads: e.target.checked})} /> 
                            Ads ({currentMkt.unidadeAds === 'R$' ? 'R$ '+ (currentMkt.taxaAds || 0).toFixed(2) : ((currentMkt.taxaAds || 0) * 100).toFixed(1) + '%'})
                        </label>
                    </div>
                    <div className={styles['checkbox-row']}>
                        <label className={styles['checkbox-label']}>
                            <input type="checkbox" className={styles['checkbox-input']} checked={checks.imposto} onChange={e => setChecks({...checks, imposto: e.target.checked})} /> 
                            Imposto ({currentMkt.unidadeImposto === 'R$' ? 'R$ '+ (currentMkt.imposto || 0).toFixed(2) : ((currentMkt.imposto || 0) * 100).toFixed(1) + '%'})
                        </label>
                    </div>
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
        </div>
    );
}