import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { splitNavigationTabs } from '../src/utils/navigation-tabs';

describe('shared bottom navigation',()=>{
  it('keeps at most five primary tabs and leaves every remaining route in More',()=>{
    const items=Array.from({length:8},(_,index)=>({path:`/module-${index}`}));
    const {visible,overflow}=splitNavigationTabs(items);
    assert.equal(visible.length,4);
    assert.equal(overflow.length,4);
    assert.deepEqual([...visible,...overflow],items);
  });
  it('keeps all tabs visible when the role has five or fewer',()=>{
    const items=Array.from({length:5},(_,index)=>index);
    assert.deepEqual(splitNavigationTabs(items),{visible:items,overflow:[]});
  });
});
