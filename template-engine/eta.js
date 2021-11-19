const Eta = require("eta");
const path = require("path");
const fp = require('fastify-plugin');

function vashViewRenderer(fastify, opts, done) {

    const defaultOpts = {
        views: path.join(__dirname, '../views')
    };
    Eta.config = { ...Eta.config, ...defaultOpts, ...opts }; 

    async function render(filename, model) {

        return await Eta.renderFile(filename, model, Eta.config);
    }

    fastify.decorateReply('view', function (filename, model) {
        return render(filename, model).then((html) => {
            this.type('text/html').send(html);
        });
    });

    fastify.decorateReply('render', function (filename, model) {
        return render(filename, model);
    });

    done();
}
module.exports = fp(vashViewRenderer, { fastify: '^3.x' });