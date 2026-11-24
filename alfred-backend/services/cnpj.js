// Receita Federal: valor de cada caractere = código ASCII menos 48.
function normalizeCnpj(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!/^(?:[a-z0-9]{12}\d{2}|[a-z0-9]{2}\.[a-z0-9]{3}\.[a-z0-9]{3}\/[a-z0-9]{4}-\d{2})$/i.test(raw)) return null;
  const value = raw.replace(/[./-]/g, '').toUpperCase();
  if (/^(.)\1+$/.test(value)) return null;
  for (const length of [12, 13]) {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      const weight = 2 + ((length - 1 - i) % 8);
      sum += (value.charCodeAt(i) - 48) * weight;
    }
    const remainder = sum % 11;
    if (Number(value[length]) !== (remainder < 2 ? 0 : 11 - remainder)) return null;
  }
  return value;
}
module.exports = {normalizeCnpj};
