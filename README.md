# nodejs Monitoring Stacks (prometheus + grafana)

```json
{
  "scripts": {
    "start:node": "node build.js && node dist/server.mjs",
    "start:prom": "prometheus --config.file=prometheus.yml",
    "start:k6": "k6 run src/k6.js"
  }
}
```

- node 서버: 8080
- 프로메테우스 서버: 9090
- 그라파나: 3000
