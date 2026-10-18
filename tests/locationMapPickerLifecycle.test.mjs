import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../components/LocationMapPicker.jsx', import.meta.url), 'utf8');
const start = source.indexOf('export default function LocationMapPicker');
const end = source.indexOf('    return (\n        <Modal', start);
const component = source.slice(start, end).replace('export default ', '') + '\nreturn {handleSearchChange, handleClearSearch, searchQuery, region, locating};\n}';
function harness() {
    const slots = []; let cursor = 0; let effects = []; let deviceCalls = 0; let resolveGps;
    const gps = new Promise(resolve => { resolveGps = resolve; });
    const memo = (fn, deps, effect = false) => {
        const i = cursor++; const previous = slots[i];
        if (!previous || deps.some((dep, index) => !Object.is(dep, previous.deps[index]))) {
            if (effect) effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
            slots[i] = { deps, value: fn, cleanup: previous?.cleanup };
        }
        return slots[i].value;
    };
    const context = {
        useRef: value => { const i=cursor++; return slots[i] ||= {current:value}; },
        useState: initial => { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i], value => { slots[i]=typeof value==='function'?value(slots[i]):value; }]; },
        useEffect: (fn,deps) => memo(fn,deps,true), useCallback: (fn,deps) => memo(fn,deps),
        DEFAULT_MAP_REGION: {latitude:0,longitude:0},
        Location: {requestForegroundPermissionsAsync:async()=>({status:'granted'})},
        getDeviceCoordinates: () => {deviceCalls++; return gps;},
        fetchAddressFromCoordinates: async()=>({location:'GPS address'}),
        fetchPlacePredictions:async()=>[], newSessionToken:()=> 'session',
        Alert:{alert(){}}, console, setTimeout, clearTimeout,
    };
    vm.createContext(context); vm.runInContext(component+'\nglobalThis.renderPicker=LocationMapPicker;',context);
    return {
        render(visible=true) { cursor=0; effects=[]; const value=context.renderPicker({visible,initialAddress:{location:'Initial address'}}); effects.forEach(fn=>fn()); return value; },
        calls:()=>deviceCalls,
        resolve:()=>resolveGps({coords:{latitude:22,longitude:75}}),
    };
}
const settle = () => new Promise(resolve=>setImmediate(resolve));
test('typing with new parent address objects does not restart GPS or erase search', async () => {
    const h=harness(); let view=h.render(); await settle();
    assert.equal(h.calls(),1);
    view.handleSearchChange('Indore'); view=h.render(); await settle();
    assert.equal(view.searchQuery,'Indore'); assert.equal(h.calls(),1);
    h.resolve(); await settle(); view=h.render();
    assert.equal(view.searchQuery,'Indore');
    assert.equal(view.region.latitude,0,'late GPS must not recenter a custom search');
    h.render(false);
});
test('closing invalidates location results and reopening initializes exactly once', async () => {
    const h=harness(); h.render(); await settle(); h.render(false);
    h.resolve(); await settle(); h.render(true); await settle();
    assert.equal(h.calls(),2);
    h.render(); assert.equal(h.calls(),2);
    h.render(false);
});
