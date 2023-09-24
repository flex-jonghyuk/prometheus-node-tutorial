import fastifyModule from "fastify";
import { collectDefaultMetrics, register } from "prom-client";

const fastify = fastifyModule({ logger: true });

collectDefaultMetrics({ prefix: "nodejs_" });

fastify.get("/metrics", (_, res) => {
  res.header("Content-Type", register.contentType);
  return register.metrics();
});

fastify.get("/fibonacci/:n", (req, res) => {
  const n = Number(req.params.n);
  const result = fibonacci(n);
  res.send({ result });
});

fastify.listen({ port: 8080 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

// 피보나치 수열 계산 함수
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
