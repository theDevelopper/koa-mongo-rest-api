const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const getUserByUsername = async function (username, url, userModel) {
    const db = await MongoClient.connect(url);
    const collection = await db.collection(userModel);
    const result = await collection.findOne({
        username: username
    });

    db.close();

    return result;
}

module.exports = function (model, mongoDbUrl, router) {
	const fn = {
		getAll: async function () {
			const db = await MongoClient.connect(mongoDbUrl);
			const collection = await db.collection(model);
			const results = await collection.find().toArray();

			db.close();

			return results;
		},

		getById: async function (id) {
			const db = await MongoClient.connect(mongoDbUrl);
			const collection = await db.collection(model);
			const result = await collection.findOne({
				_id: new ObjectID(id)
			});

			db.close();

			return result;
		},

		addAll: async function (data) {
			if (Object.keys(data).length) {
				const db = await MongoClient.connect(mongoDbUrl);
				const collection = await db.collection(model);

				if (Array.isArray(data)) {
					await collection.insertMany(data);
				} else {
					await collection.insertOne(data);
				}

				db.close();
				return data;
			} else {
				return [];
			}
		},

		updateById: async function (id, data) {
			if (Object.keys(data).length) {
				const db = await MongoClient.connect(mongoDbUrl);
				const collection = await db.collection(model);

				if (!Array.isArray(data) && ObjectID.isValid(id)) {
					delete data._id;

					await collection.updateOne({
						_id: new ObjectID(id)
					}, {
							$set: data
						}, {
							upsert: true
						});

					const result = await collection.findOne({ _id: new ObjectID(id) })

					db.close();
					return result;
				}
			}
		},

		replaceById: async function (id, data) {
			if (Object.keys(data).length) {
				const db = await MongoClient.connect(mongoDbUrl);
				const collection = await db.collection(model);

				if (!Array.isArray(data) && ObjectID.isValid(id)) {
					await collection.replaceOne({
						_id: new ObjectID(id)
					},
						data, {
							upsert: true
						});

					const result = await collection.findOne({ _id: new ObjectID(id) })

					db.close();
					return result;
				}
			}
		},

		deleteById: async function (id) {
			if (Object.keys(ctx.request.body).length) {
				const db = await MongoClient.connect(mongoDbUrl);
				const collection = await db.collection(model);

				if (ObjectID.isValid(id)) {
					await collection.remove({ _id: new ObjectID(id) });

					db.close();
					return true;
				}
			}

			return false;
		}
	};

	router.get(`/${model}`, async (ctx, next) => { ctx.body = await fn.getAll() })
		.get(`/${model}/:id`, async (ctx, next) => { ctx.body = await fn.getById(ctx.params.id) })
		.post(`/${model}`, async (ctx, next) => { ctx.body = await fn.addAll(ctx.request.body) })
		.post(`/${model}/:id`, async (ctx, next) => { ctx.body = await fn.updateById(ctx.params.id, ctx.request.body) })
		.patch(`/${model}/:id`, async (ctx, next) => { ctx.body = await fn.updateById(ctx.params.id, ctx.request.body) })
		.put(`/${model}`, async (ctx, next) => { ctx.body = await fn.addAll(ctx.request.body) })
		.put(`/${model}/:id`, async (ctx, next) => { ctx.body = await fn.replaceById(ctx.params.id, ctx.request.body) })
		.delete(`/${model}/:id`, async (ctx, next) => { ctx.body = await fn.deleteById(ctx.params.id) ? 'ok' : '' });

	return fn;
}