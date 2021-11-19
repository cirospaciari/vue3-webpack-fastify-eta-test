const path = require('path');
const fastify = require('fastify')();


global.SCRIPT_ENTRIES = [];
global.CSS_ENTRIES = [];

require('./static/asset-manifest.json').entrypoints.forEach((entrypoint)=> {

    if(entrypoint.endsWith('.js')){
        SCRIPT_ENTRIES.push(entrypoint);
    }else if(entrypoint.endsWith('.css')){
        CSS_ENTRIES.push(entrypoint);
    }
})

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'static')
});

fastify.register(require('./template-engine/eta'), {
    views: path.resolve('./views'),
    cache: true // Make Eta cache templates
});

fastify.get('/', async (request, reply) => {
 
    const model = {
        message: 'Hello World',
        title: 'My title'
    }; 

    reply.view('home/index.eta', model);
});

fastify.listen(process.env.PORT || 8080, '0.0.0.0', () => {

    console.info(`Running in http://127.0.0.1:${process.env.PORT || 8080}`);
})