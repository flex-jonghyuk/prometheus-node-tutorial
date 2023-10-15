import fastifyModule from "fastify";
import {
  collectDefaultMetrics,
  register,
  Counter,
  Histogram,
} from "prom-client";

const fastify = fastifyModule({ logger: true });

collectDefaultMetrics({ prefix: "nodejs_" });

const totalRequests = new Counter({
  name: "http_total_requests",
  help: "Total number of HTTP requests",
});

const responseDurationHistogram = new Histogram({
  name: "http_response_duration_seconds",
  help: "Duration of HTTP responses in seconds",
  buckets: [0.1, 0.5, 1, 2, 5], // 예시로, 0.1초, 0.5초, 1초, 2초, 5초 이상의 응답 시간을 측정.
});

// 모든 요청에 대해 요청 카운터 증가
fastify.addHook("onRequest", (request, _, done) => {
  totalRequests.inc();
  request.startTime = process.hrtime();
  done();
});

fastify.addHook("onResponse", (request, _, done) => {
  // 응답을 보낼 때 응답 지연 시간 측정
  const [seconds, nanoseconds] = process.hrtime(request.startTime);
  const durationInSeconds = seconds + nanoseconds / 1e9;
  responseDurationHistogram.observe(durationInSeconds);

  done();
});

fastify.get("/metrics", (_, res) => {
  console.info("매트릭 요청 왔다!");
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
