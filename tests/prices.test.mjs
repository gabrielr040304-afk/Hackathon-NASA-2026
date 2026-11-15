import test from 'node:test';
import assert from 'node:assert/strict';
import {priceFor,selectedPrices} from '../js/prices.js';
import {ESSENTIALS,EQUIPMENT,PREPARATION_EXTRAS,OPTIONAL_PREPARATION,SHELTERS} from '../js/config.js';
test('all selectable priced items have a finite allowance and traceable budget anchor',()=>{
  for(const item of [...ESSENTIALS,...EQUIPMENT,...PREPARATION_EXTRAS,...OPTIONAL_PREPARATION,...SHELTERS,{id:'rover'},{id:'chemical'},{id:'nuclear'}]) {
    const price=priceFor(item.id);assert.ok(price.million>0);assert.ok(Number.isFinite(price.million));assert.ok(price.reference.url.startsWith('https://'));
  }
});
test('personal systems scale with crew while shared provisions count once',()=>{
  const selection={essentials:['oxygen','oxygen'],equipment:[],extras:[],optional:[],shelter:null,rover:false,crew:4};
  const result=selectedPrices(selection);
  assert.equal(result.total,priceFor('oxygen').million*4);
  assert.equal(selectedPrices({...selection,crew:8}).total,result.total*2);
  assert.equal(selectedPrices({...selection,shelter:'shell'}).total,result.total+priceFor('shell').million);
  assert.equal(selectedPrices({...selection,rover:true}).total,result.total+priceFor('rover').million);
});
test('the full life support allocation equals its stated program scale anchor',()=>{
  assert.ok(Math.abs(ESSENTIALS.reduce((sum,item)=>sum+priceFor(item.id).million,0)-228.5)<1e-8);
});

test('transport alternatives are exclusive and included once in the total',()=>{
  const selection={essentials:['power','pressure'],equipment:[],extras:[],optional:[],shelter:null,rover:false,crew:6,propulsion:'chemical'};
  const result=selectedPrices(selection);
  assert.equal(result.rows.find(row=>row.id==='power').quantity,6);
  assert.equal(result.rows.find(row=>row.id==='pressure').quantity,6);
  assert.equal(result.rows.find(row=>row.id==='chemical').quantity,1);
  assert.equal(result.rows.some(row=>row.id==='nuclear'),false);
  assert.equal(selectedPrices({...selection,propulsion:'nuclear'}).total-result.total,priceFor('nuclear').million-priceFor('chemical').million);
});
