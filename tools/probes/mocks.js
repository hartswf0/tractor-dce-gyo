// the harness's network policy after the container reset: three and OrbitControls from node_modules, every other host refused at once so the page's offline fallbacks (the baked valley, no buildings) take over without waiting
const fs = require('fs'), path = require('path');
exports.routes = async ctx => {
  await ctx.route(/^https?:\/\/(?!localhost)/, r => { const u = r.request().url(); let f = null;
    if (u.includes('three.min.js')) f = require.resolve('three/build/three.min.js');
    else if (u.includes('OrbitControls')) f = require.resolve('three/examples/js/controls/OrbitControls.js');
    if (f) return r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f, 'utf8') });
    if (u.includes('cdn.jsdelivr.net')) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return r.abort(); });
};
