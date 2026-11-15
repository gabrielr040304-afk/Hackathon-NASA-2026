import test from 'node:test';
import assert from 'node:assert/strict';
import {priceFor,selectedPrices} from '../js/prices.js';
import {ESSENTIALS,EQUIPMENT,PREPARATION_EXTRAS,OPTIONAL_PREPARATION,SHELTERS} from '../js/config.js';
test('all selectable priced items have a finite allowance and traceable budget anchor',()=>{
  for(const item of [...ESSENTIALS,...EQUIPMENT,...PREPARATION_EXTRAS,...OPTIONAL_PREPARATION,...SHELTERS,{id:'rover'}]) {
    const price=priceFor(item.id);assert.ok(price.million>0);assert.ok(Number.isFinite(price.million));assert.ok(price.reference.url.startsWith('https://'));
  }
});
test('allowances count once per mission, deduplicate selections and do not multiply by crew',()=>{
  const selection={essentials:['oxygen','oxygen'],equipment:[],extras:[],optional:[],shelter:null,rover:false,crew:4};
  const result=selectedPrices(selection);
  assert.equal(result.total,priceFor('oxygen').million);
  assert.equal(selectedPrices({...selection,crew:8}).total,result.total);
  assert.equal(selectedPrices({...selection,rover:true}).total,result.total+priceFor('rover').million);
});
test('the full life support allocation equals its stated program scale anchor',()=>{
  assert.ok(Math.abs(ESSENTIALS.reduce((sum,item)=>sum+priceFor(item.id).million,0)-228.5)<1e-8);
});
