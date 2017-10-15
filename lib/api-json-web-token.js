const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const jwt = require('koa-jwt');
const jsonwebtoken = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const getUserByUsername = async function (username, userDbUrl, userModel) {
    const db = await MongoClient.connect(userDbUrl);
    const collection = await db.collection(userModel);
    const result = await collection.findOne({
        username: username
    });

    db.close();

    return result;
}

module.exports = {
	enableJsonWebToken: function (router, secret, unless) {
		router.use(jwt({
			secret: secret || 'poor secret'
		})
		.unless({
			path: [/^\/api\/register/, /^\/api\/login/, "/"]
		}));
	},

	enableLogin: function(router, userModel = 'users', userDbUrl, expiration = Math.floor(Date.now() / 1000) - (60 * 60)) {
		router.post('/login', async (ctx, next) => {
			let user = await getUserByUsername(ctx.request.body.username, userDbUrl, userModel);
			if (!user) {
				ctx.status = 401;
				ctx.body = {
					error: "bad username"
				}
				return;
			}
			const {password, ...userInfoWithoutPassword} = user;

			if (await bcrypt.compare(ctx.request.body.password, password)) {
				ctx.body = {
					token: jsonwebtoken.sign({
						data: userInfoWithoutPassword,
						exp: expiration
					}, 'secret')
				}
				next();
			} else {
				ctx.status = 401;
				ctx.body = {
					error: 'bad password'
				}
				return;
			}
		});
	},

	enableRegistration: function (router, userModel = 'users', userDbUrl) {
		router.post('/register', async (ctx, next) => {
			if (!ctx.request.body.username || !ctx.request.body.password) {
				ctx.status = 400;
				ctx.body = {
					error: `expected an object with username, password, name but got:  ${ctx.request.body}`
				}
				return;
			}

			ctx.request.body.password = await bcrypt.hash(ctx.request.body.password, 5);
			const user = await getUserByUsername(ctx.request.body.username, userDbUrl, userModel);
			if (!user) {
				const db = await MongoClient.connect(userDbUrl);
				const collection = await db.collection(userModel);
				await collection.insertOne(ctx.request.body);
			
				db.close();

				ctx.status = 200;
				ctx.body = {
					message: "success"
				};
				next();
			} else {
				ctx.status = 406;
				ctx.body = {
					error: "User exists"
				}
				return;
			}
		});
	}
	
}