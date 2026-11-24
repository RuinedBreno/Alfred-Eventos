const test = require('node:test');
const assert = require('node:assert/strict');
const {normalizeCnpj} = require('../services/cnpj');
test('normaliza CNPJs numéricos e alfanuméricos preservando os zeros iniciais',()=>{
  assert.equal(normalizeCnpj('04.252.011/0001-10'),'04252011000110');
  assert.equal(normalizeCnpj('00.000.000/e08g-12'),'00000000E08G12');
});
test('recusa campos ausentes, pontuação incorreta e verificadores inválidos',()=>{
  for(const input of [null,'','00000000000000','04252011000111','00000000E08G1X','04-252011000110'])
    assert.equal(normalizeCnpj(input),null);
});
