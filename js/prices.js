import { PRICE_ALLOWANCES, PRICE_REFERENCES, PERSONAL_PRICE_IDS } from './config.js';
export function priceFor(id) {
  const entry=PRICE_ALLOWANCES[id];
  if(!entry)return null;
  const [key,factor]=entry,reference=PRICE_REFERENCES[key];
  const personal=PERSONAL_PRICE_IDS.includes(id);
  const group=personal?'personal':['chemical','nuclear'].includes(id)?'transport':['shell','polymer','regolith','rover'].includes(id)?'habitat':'preparation';
  return {million:reference.million*factor,factor,reference,personal,group};
}
export function selectedPrices(selection) {
  const ids=[...selection.essentials,...selection.equipment,...selection.extras,...selection.optional,...(selection.shelter?[selection.shelter]:[]),...(selection.rover?['rover']:[]),...(selection.propulsion?[selection.propulsion]:[])];
  const crew=Number.isFinite(Number(selection.crew))?Math.max(1,Math.floor(Number(selection.crew))):1;
  const rows=[...new Set(ids)].map(id=>{
    const price=priceFor(id);if(!price)throw Error(`Unknown priced item: ${id}`);
    const quantity=price.personal?crew:1;
    return {id,...price,quantity,subtotal:price.million*quantity};
  });
  return {rows,total:rows.reduce((sum,item)=>sum+item.subtotal,0)};
}
