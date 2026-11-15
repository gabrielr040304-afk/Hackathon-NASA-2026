import { PRICE_ALLOWANCES, PRICE_REFERENCES } from './config.js';
export function priceFor(id) {
  const entry=PRICE_ALLOWANCES[id];
  if(!entry)return null;
  const [key,factor]=entry,reference=PRICE_REFERENCES[key];
  return {million:reference.million*factor,factor,reference};
}
export function selectedPrices(selection) {
  const ids=[...selection.essentials,...selection.equipment,...selection.extras,...selection.optional,...(selection.shelter?[selection.shelter]:[]),...(selection.rover?['rover']:[])];
  const rows=[...new Set(ids)].map(id=>({id,...priceFor(id)}));
  return {rows,total:rows.reduce((sum,item)=>sum+item.million,0)};
}
