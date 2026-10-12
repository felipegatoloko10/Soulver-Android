/**
 * SoulverEngine.js - Réplica do SoulverCore (iOS)
 * Avaliador matemático reativo linha a linha em linguagem natural com suporte i18n
 */

const CURRENCY_RATES = {
  USD: 1.0,
  BRL: 5.80,
  EUR: 0.88,
  GBP: 0.75,
  CAD: 1.38,
  JPY: 152.4,
  AUD: 1.54,
  CHF: 0.89,
  CNY: 7.25,
  BTC: 0.000015,
  ETH: 0.00038
};

const UNITS = {
  // Comprimento (base: metros)
  m: { base: 1, type: 'length' },
  metro: { base: 1, type: 'length' },
  metros: { base: 1, type: 'length' },
  meter: { base: 1, type: 'length' },
  meters: { base: 1, type: 'length' },
  km: { base: 1000, type: 'length' },
  quilometro: { base: 1000, type: 'length' },
  quilometros: { base: 1000, type: 'length' },
  cm: { base: 0.01, type: 'length' },
  centimetro: { base: 0.01, type: 'length' },
  mm: { base: 0.001, type: 'length' },
  milha: { base: 1609.34, type: 'length' },
  milhas: { base: 1609.34, type: 'length' },
  mile: { base: 1609.34, type: 'length' },
  miles: { base: 1609.34, type: 'length' },
  pe: { base: 0.3048, type: 'length' },
  pes: { base: 0.3048, type: 'length' },
  foot: { base: 0.3048, type: 'length' },
  feet: { base: 0.3048, type: 'length' },
  polegada: { base: 0.0254, type: 'length' },
  polegadas: { base: 0.0254, type: 'length' },
  inch: { base: 0.0254, type: 'length' },
  inches: { base: 0.0254, type: 'length' },

  // Massa (base: gramas)
  g: { base: 1, type: 'mass' },
  grama: { base: 1, type: 'mass' },
  gramas: { base: 1, type: 'mass' },
  kg: { base: 1000, type: 'mass' },
  quilo: { base: 1000, type: 'mass' },
  quilos: { base: 1000, type: 'mass' },
  mg: { base: 0.001, type: 'mass' },
  lb: { base: 453.592, type: 'mass' },
  lbs: { base: 453.592, type: 'mass' },
  libra: { base: 453.592, type: 'mass' },
  libras: { base: 453.592, type: 'mass' },
  oz: { base: 28.3495, type: 'mass' },
  onca: { base: 28.3495, type: 'mass' },

  // Tempo (base: segundos)
  s: { base: 1, type: 'time' },
  segundo: { base: 1, type: 'time' },
  segundos: { base: 1, type: 'time' },
  min: { base: 60, type: 'time' },
  minuto: { base: 60, type: 'time' },
  minutos: { base: 60, type: 'time' },
  h: { base: 3600, type: 'time' },
  hora: { base: 3600, type: 'time' },
  horas: { base: 3600, type: 'time' },
  dia: { base: 86400, type: 'time' },
  dias: { base: 86400, type: 'time' },
  day: { base: 86400, type: 'time' },
  days: { base: 86400, type: 'time' },
  semana: { base: 604800, type: 'time' },
  semanas: { base: 604800, type: 'time' },
  mes: { base: 2592000, type: 'time' },
  meses: { base: 2592000, type: 'time' },
  ano: { base: 31536000, type: 'time' },
  anos: { base: 31536000, type: 'time' },

  // Dados / Digital (base: bytes)
  b: { base: 1, type: 'data' },
  byte: { base: 1, type: 'data' },
  bytes: { base: 1, type: 'data' },
  kb: { base: 1024, type: 'data' },
  mb: { base: 1048576, type: 'data' },
  gb: { base: 1073741824, type: 'data' },
  tb: { base: 1099511627776, type: 'data' }
};

class SoulverEngine {
  constructor(options = {}) {
    this.currencyRates = { ...CURRENCY_RATES, ...(options.currencyRates || {}) };
    this.variables = {};
  }

  evaluateSheet(text) {
    const lines = text.split('\n');
    const results = [];
    const lineValues = [];
    let runningTotal = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        results.push({ lineIndex: i, text: '', value: null, formatted: '', isComment: true });
        lineValues.push(null);
        continue;
      }

      // Comentários explícitos
      if (line.startsWith('//') || line.startsWith('#')) {
        results.push({ lineIndex: i, text: line, value: null, formatted: '', isComment: true });
        lineValues.push(null);
        continue;
      }

      try {
        const evalRes = this.evaluateLine(line, lineValues, runningTotal);
        if (evalRes && evalRes.value !== null && !isNaN(evalRes.value)) {
          runningTotal += evalRes.value;
          lineValues.push(evalRes.value);
          results.push({
            lineIndex: i,
            text: line,
            value: evalRes.value,
            unit: evalRes.unit,
            formatted: evalRes.formatted,
            isComment: false
          });
        } else {
          lineValues.push(null);
          results.push({
            lineIndex: i,
            text: line,
            value: null,
            formatted: '',
            isComment: false
          });
        }
      } catch (err) {
        lineValues.push(null);
        results.push({
          lineIndex: i,
          text: line,
          value: null,
          formatted: '',
          error: err.message
        });
      }
    }

    return {
      lines: results,
      total: runningTotal,
      formattedTotal: this.formatNumber(runningTotal)
    };
  }

  evaluateLine(rawText, previousLines = [], runningTotal = 0) {
    let text = rawText;

    // 1. Detecção de atribuição de variável (ex: x = 50 ou aluguel = 1200)
    let varName = null;
    const assignMatch = text.match(/^([a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ_][a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ_\s]*)\s*[:=]\s*(.+)$/);
    if (assignMatch) {
      varName = assignMatch[1].trim().toLowerCase();
      text = assignMatch[2].trim();
    }

    // 2. Substituição de referências especiais:
    // - total / soma
    text = text.replace(/\b(total|soma|running total)\b/gi, `${runningTotal}`);

    // - anterior / last / ans / prev
    const lastValidVal = [...previousLines].reverse().find(v => v !== null && !isNaN(v)) || 0;
    text = text.replace(/\b(anterior|last|ans|prev|previous)\b/gi, `${lastValidVal}`);

    // - linha N / line N / lN
    text = text.replace(/\b(?:linha|line|l)\s*(\d+)\b/gi, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      const v = previousLines[idx];
      return v !== undefined && v !== null ? ` ${v} ` : ' 0 ';
    });

    // 3. Substituição de variáveis salvas
    for (const [k, v] of Object.entries(this.variables)) {
      const regex = new RegExp(`\\b${k}\\b`, 'gi');
      text = text.replace(regex, `${v}`);
    }

    // 4. Conversão de Moedas (ex: 50 USD em BRL, 100 EUR to USD, R$ 50 para USD)
    const currencyConvMatch = text.match(/([0-9.,]+)\s*([A-Za-z$R$€£]+)\s*(?:em|para|to|in|into)\s*([A-Za-z$R$€£]+)/i);
    if (currencyConvMatch) {
      const amount = this.parseNumber(currencyConvMatch[1]);
      const fromCurr = this.normalizeCurrency(currencyConvMatch[2]);
      const toCurr = this.normalizeCurrency(currencyConvMatch[3]);

      if (this.currencyRates[fromCurr] && this.currencyRates[toCurr]) {
        // Converte para base USD depois para a moeda destino
        const inUSD = amount / this.currencyRates[fromCurr];
        const finalVal = inUSD * this.currencyRates[toCurr];
        return {
          value: finalVal,
          unit: toCurr,
          formatted: `${toCurr} ${this.formatNumber(finalVal)}`
        };
      }
    }

    // 5. Conversão de Unidades (ex: 10 km em milhas, 5 kg to lbs)
    const unitConvMatch = text.match(/([0-9.,]+)\s*([a-zA-Z]+)\s*(?:em|para|to|in|into)\s*([a-zA-Z]+)/i);
    if (unitConvMatch) {
      const amount = this.parseNumber(unitConvMatch[1]);
      const fromU = UNITS[unitConvMatch[2].toLowerCase()];
      const toU = UNITS[unitConvMatch[3].toLowerCase()];

      if (fromU && toU && fromU.type === toU.type) {
        const inBase = amount * fromU.base;
        const converted = inBase / toU.base;
        return {
          value: converted,
          unit: unitConvMatch[3],
          formatted: `${this.formatNumber(converted)} ${unitConvMatch[3]}`
        };
      }
    }

    // 6. Cálculos de porcentagem em linguagem natural:
    // "20% de 500" / "20% of 500"
    text = text.replace(/([0-9.,]+)%\s*(?:de|of)\s*([0-9.,]+)/gi, (m, p, val) => {
      const pct = this.parseNumber(p);
      const total = this.parseNumber(val);
      return `${(pct / 100) * total}`;
    });

    // "500 + 10%" -> 550
    text = text.replace(/([0-9.,]+)\s*\+\s*([0-9.,]+)%/g, (m, base, p) => {
      const b = this.parseNumber(base);
      const pct = this.parseNumber(p);
      return `${b + (b * (pct / 100))}`;
    });

    // "500 - 10%" / "500 com 10% de desconto" / "500 off 10%" -> 450
    text = text.replace(/([0-9.,]+)\s*-\s*([0-9.,]+)%/g, (m, base, p) => {
      const b = this.parseNumber(base);
      const pct = this.parseNumber(p);
      return `${b - (b * (pct / 100))}`;
    });
    text = text.replace(/([0-9.,]+)\s*(?:com|menos|-)\s*([0-9.,]+)%\s*(?:de\s*desconto|off)/gi, (m, base, p) => {
      const b = this.parseNumber(base);
      const pct = this.parseNumber(p);
      return `${b - (b * (pct / 100))}`;
    });

    // "50 como % de 200" / "50 as a % of 200"
    text = text.replace(/([0-9.,]+)\s*(?:como|as a|as)\s*%\s*(?:de|of)\s*([0-9.,]+)/gi, (m, v, total) => {
      const part = this.parseNumber(v);
      const tot = this.parseNumber(total);
      return tot !== 0 ? `${(part / tot) * 100}%` : '0%';
    });

    // 7. Limpeza de palavras descritivas soltas (ex: "Salário R$ 5000 + Bônus 1200")
    // Mantém operadores (+, -, *, /, ^, (, ), %, ., vírgulas com dígitos)
    // Remove palavras de rótulo antes ou depois de expressões matemáticas
    let mathExpr = text
      .replace(/R\$\s*/g, '')
      .replace(/\$\s*/g, '')
      .replace(/€\s*/g, '')
      .replace(/£\s*/g, '')
      .replace(/x|×/gi, '*')
      .replace(/÷/g, '/');

    // Remove palavras soltas (letras puras que sobraram)
    mathExpr = mathExpr.replace(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ_]+/g, ' ').trim();

    // Normaliza separadores de milhar e decimais (ex: 1.500,50 ou 1,500.50)
    mathExpr = this.sanitizeMathExpression(mathExpr);

    if (!mathExpr || !/[0-9]/.test(mathExpr)) {
      return { value: null, formatted: '' };
    }

    // Avaliação segura da expressão aritmética
    const val = this.safeCalculate(mathExpr);
    if (val !== null && !isNaN(val)) {
      if (varName) {
        this.variables[varName] = val;
      }
      return {
        value: val,
        formatted: this.formatNumber(val)
      };
    }

    return { value: null, formatted: '' };
  }

  parseNumber(str) {
    if (!str) return 0;
    const clean = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }

  sanitizeMathExpression(expr) {
    // Trata vírgulas como ponto decimal se não houver múltiplos pontos
    return expr
      .replace(/,/g, '.')
      .replace(/[^0-9+\-*/().%^eE ]/g, '')
      .replace(/\s+/g, ' ');
  }

  safeCalculate(expr) {
    try {
      // Usando Function com escopo estrito e caracteres restritos
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
        return null;
      }
      const fn = new Function(`'use strict'; return (${expr});`);
      const res = fn();
      return typeof res === 'number' && isFinite(res) ? res : null;
    } catch {
      return null;
    }
  }

  normalizeCurrency(curr) {
    const c = curr.toUpperCase().trim();
    if (c === 'R$' || c === 'BRL' || c === 'REAL' || c === 'REAIS') return 'BRL';
    if (c === '$' || c === 'USD' || c === 'DOLAR' || c === 'DÓLAR') return 'USD';
    if (c === '€' || c === 'EUR' || c === 'EURO') return 'EUR';
    if (c === '£' || c === 'GBP' || c === 'LIBRA') return 'GBP';
    if (c === 'BTC' || c === 'BITCOIN') return 'BTC';
    return c;
  }

  formatNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return '';
    return Number(val).toLocaleString('pt-BR', {
      maximumFractionDigits: 4,
      minimumFractionDigits: Number.isInteger(val) ? 0 : 2
    });
  }
}

if (typeof module !== 'undefined') {
  module.exports = SoulverEngine;
}
