const Router = require('koa-router');

const generate = require('./lib/api-generate');
const Security = require('./lib/api-json-web-token');

module.exports = class Api {
	constructor (mongoDbUrl) {
		this.mongoDbUrl = mongoDbUrl;
		this.router = new Router();
		this.model = {};
	}

	generate (model, mongoDbUrl = undefined) {
		this.model[model] = generate(model, mongoDbUrl || this.mongoDbUrl, this.router);
		return this;
	}

	enableJsonWebToken (userModel = 'users', userDbUrl, secret, unless) {
		Security.enableJsonWebToken(this.router, secret, unless);
		Security.enableLogin(this.router, userModel, userDbUrl || this.mongoDbUrl);
		return this;
	}

	enableRegistration (userModel = 'users', userDbUrl) {
		Security.enableRegistration(this.router, userModel, userDbUrl || this.mongoDbUrl);
		return this;
	}

	get () {
		this.router.get(...arguments);
		return this;
	}

	post () {
		this.router.post(...arguments);
		return this;
	}

	del () {
		this.router.delete(...arguments);
		return this;
	}

	delete () {
		this.router.delete(...arguments);
		return this;
	}

	put () {
		this.router.put(...arguments);
		return this;
	}

	patch () {
		this.router.patch(...arguments);
		return this;
	}

	router () {
		return this.router;
	}

	routes () {
		return this.router.routes();
	}

	allowedMethods () {
		return this.router.allowedMethods();
	}
} 