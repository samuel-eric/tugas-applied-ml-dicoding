require("dotenv").config();

const Hapi = require("@hapi/hapi");
const routes = require("../server/routes");
const loadModel = require("../services/loadModel");

(async () => {
	const server = Hapi.server({
		port: 3000,
		host: "0.0.0.0",
		routes: {
			cors: {
				origin: ["*"],
			},
		},
	});

	const model = await loadModel();
	server.app.model = model;

	server.route(routes);

	server.ext("onPreResponse", function (request, h) {
		const response = request.response;

		if (response.isBoom && response.output.statusCode === 413) {
			return h
				.response({
					status: "fail",
					message:
						"Payload content length greater than maximum allowed: 1000000",
				})
				.code(413);
		}

		if (response.isBoom) {
			const newResponse = h.response({
				status: "fail",
				message: response.message,
			});
			newResponse.code(
				response.output.statusCode === 500 ? 400 : response.output.statusCode
			);
			return newResponse;
		}

		return h.continue;
	});

	await server.start();
	console.log(`Server start at: ${server.info.uri}`);
})();
