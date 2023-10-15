# nodejs Monitoring Stacks (prometheus + grafana)

## 1. 각 컴포넌트의 정의와 매트릭 흐름 감 잡기

대충의 흐름을 정리해보자

### prometheus

"매트릭 수집 도구", monitoring platform that collects metrics from monitored targets by scraping metrics HTTP endpoints on these targets.

서버가 떠있고 주기적으로 metric을 http리퀘스트로 pull해오는 구조. 매트릭을 시계열로 배열하여 쿼리 언어로 조회할 수 있는 기능도 제공(PromQL). 서버는 go로 작성되서 binary로 제공된다(설치 실행이 쉬움), sound cloud에서 만들었다고 한다.

대시보드를 제공하지만 주로 PromQL과 관련된 기능들을 제공하며, grafana등과 같이 사용해야 온전한 시각화를 할 수 있다.

## Configuration

YAML로 한다. 애플리케이션이랑 관련있는건 아니고 Prometheus 서버의 config역할을 한다.

```yaml
global:
  scrape_interval: 15s # 얼마 간격으로 매트릭을 긁어올것인지
  evaluation_interval: 15s # 얼마 간격으로 룰을 재평가 할것인지

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"] # 매트릭 가져올 주소
```

요런식으로 config하고 요래 하면 서버가 시작된다. 9090에 UI도 뜸

```bash
./prometheus --config.file=prometheus.yml
```

- `promhttp_metric_handler_requests_total` : the total number of `/metrics` requests the Prometheus server has served
  - `promhttp_metric_handler_requests_total{code="200"}`

### 특징

#### 데이터 모델

- 모든 매트릭 데이터를 시계열로 관리한다.
  - Prometheus는 기본적으로 모든 데이터를 시계열, 즉 동일한 메트릭과 동일한 레이블이 지정된 차원 집합에 속하는 타임스탬프가 지정된 값의 스트림으로 저장합니다.
- 매트릭 이름은 스네이크 케이스

#### 매트릭 타입

모든 프로메테우스 메트릭은 다음과 같은 형태를 띈다.
`메트릭명{라벨명=값, 라벨명=값} 샘플링 데이터`

샘플 데이터의 종류는 다음 4가지다.

- **Counter**: 위로 점증 하거나 reset후 다시 위로 올라가는 값
  - A *counter* is a cumulative metric that represents a single [monotonically increasing counter](https://en.wikipedia.org/wiki/Monotonic_function) whose value can only increase or be reset to zero on restart. For example, you can use a counter to represent the number of requests served, tasks completed, or errors.
- **Gauge**: 위아래로 왔다갔다할 수 있는 single numeric value
  - A *gauge* is a metric that represents a single numerical value that can arbitrarily go up and down. Gauges are typically used for measured values like temperatures or current memory usage, but also "counts" that can go up and down, like the number of concurrent requests.
- **Histogram**: 특정 범위 내에서 값의 빈도수를 표현
  - A *histogram* samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.
- **Summary**: histogram과 유사한데 사분위수까지 표현(current counts/all)
  - Similar to a *histogram*, a *summary* samples observations (usually things like request durations and response sizes). While it also provides a total count of observations and a sum of all observed values, it calculates configurable quantiles over a sliding time window.

# prom-client

node의 주요 매트릭을 뽑아주는 역할을 하는 node 라이브러리다. nodejs의 `cluster` 모듈을 사용해서 프로세스의 매트릭들을 뽑아낸다. [프로메테우스에서 권장하는 프로세스 관련 매트릭들](https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors)

이외에도 client라는 구현체를 사용해서 counter, guage, histogram, summary 등을 만들어낼 수 있다. 미들웨어 같은걸 달아가지고 rps같은걸 내보낼 수도 있다.

기본으로 뽑아내주는 매트릭은 아래처럼 생겼다.

```shell
# HELP nodejs_process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE nodejs_process_cpu_user_seconds_total counter
nodejs_process_cpu_user_seconds_total 0.9117540000000001

# HELP nodejs_process_cpu_system_seconds_total Total system CPU time spent in seconds.
# TYPE nodejs_process_cpu_system_seconds_total counter
nodejs_process_cpu_system_seconds_total 0.788986

# HELP nodejs_process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE nodejs_process_cpu_seconds_total counter
nodejs_process_cpu_seconds_total 1.70074

# HELP nodejs_process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE nodejs_process_start_time_seconds gauge
nodejs_process_start_time_seconds 1697378845

# HELP nodejs_process_resident_memory_bytes Resident memory size in bytes.
# TYPE nodejs_process_resident_memory_bytes gauge
nodejs_process_resident_memory_bytes 45826048

# HELP nodejs_nodejs_eventloop_lag_seconds Lag of event loop in seconds.
# TYPE nodejs_nodejs_eventloop_lag_seconds gauge
nodejs_nodejs_eventloop_lag_seconds 0.01260325

# HELP nodejs_nodejs_eventloop_lag_min_seconds The minimum recorded event loop delay.
# TYPE nodejs_nodejs_eventloop_lag_min_seconds gauge
nodejs_nodejs_eventloop_lag_min_seconds 0.006885376

# HELP nodejs_nodejs_eventloop_lag_max_seconds The maximum recorded event loop delay.
# TYPE nodejs_nodejs_eventloop_lag_max_seconds gauge
nodejs_nodejs_eventloop_lag_max_seconds 0.029212671

# HELP nodejs_nodejs_eventloop_lag_mean_seconds The mean of the recorded event loop delays.
# TYPE nodejs_nodejs_eventloop_lag_mean_seconds gauge
nodejs_nodejs_eventloop_lag_mean_seconds 0.011025344335673364

# HELP nodejs_nodejs_eventloop_lag_stddev_seconds The standard deviation of the recorded event loop delays.
# TYPE nodejs_nodejs_eventloop_lag_stddev_seconds gauge
nodejs_nodejs_eventloop_lag_stddev_seconds 0.0006460628901417268

# HELP nodejs_nodejs_eventloop_lag_p50_seconds The 50th percentile of the recorded event loop delays.
# TYPE nodejs_nodejs_eventloop_lag_p50_seconds gauge
nodejs_nodejs_eventloop_lag_p50_seconds 0.011051007

# HELP nodejs_nodejs_eventloop_lag_p90_seconds The 90th percentile of the recorded event loop delays.
# TYPE nodejs_nodejs_eventloop_lag_p90_seconds gauge
nodejs_nodejs_eventloop_lag_p90_seconds 0.011214847

# HELP nodejs_nodejs_eventloop_lag_p99_seconds The 99th percentile of the recorded event loop delays.
# TYPE nodejs_nodejs_eventloop_lag_p99_seconds gauge
nodejs_nodejs_eventloop_lag_p99_seconds 0.013729791

# HELP nodejs_nodejs_active_resources Number of active resources that are currently keeping the event loop alive, grouped by async resource type.
# TYPE nodejs_nodejs_active_resources gauge
nodejs_nodejs_active_resources{type="FSReqCallback"} 1
nodejs_nodejs_active_resources{type="TTYWrap"} 3
nodejs_nodejs_active_resources{type="TCPServerWrap"} 2
nodejs_nodejs_active_resources{type="TCPSocketWrap"} 2
nodejs_nodejs_active_resources{type="Immediate"} 1

# HELP nodejs_nodejs_active_resources_total Total number of active resources.
# TYPE nodejs_nodejs_active_resources_total gauge
nodejs_nodejs_active_resources_total 9

# HELP nodejs_nodejs_active_handles Number of active libuv handles grouped by handle type. Every handle type is C++ class name.
# TYPE nodejs_nodejs_active_handles gauge
nodejs_nodejs_active_handles{type="WriteStream"} 2
nodejs_nodejs_active_handles{type="ReadStream"} 1
nodejs_nodejs_active_handles{type="Server"} 2
nodejs_nodejs_active_handles{type="Socket"} 2

# HELP nodejs_nodejs_active_handles_total Total number of active handles.
# TYPE nodejs_nodejs_active_handles_total gauge
nodejs_nodejs_active_handles_total 7

# HELP nodejs_nodejs_active_requests Number of active libuv requests grouped by request type. Every request type is C++ class name.
# TYPE nodejs_nodejs_active_requests gauge
nodejs_nodejs_active_requests{type="FSReqCallback"} 1

# HELP nodejs_nodejs_active_requests_total Total number of active requests.
# TYPE nodejs_nodejs_active_requests_total gauge
nodejs_nodejs_active_requests_total 1

# HELP nodejs_nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.
# TYPE nodejs_nodejs_heap_size_total_bytes gauge
nodejs_nodejs_heap_size_total_bytes 9175040

# HELP nodejs_nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_nodejs_heap_size_used_bytes gauge
nodejs_nodejs_heap_size_used_bytes 8293904

# HELP nodejs_nodejs_external_memory_bytes Node.js external memory size in bytes.
# TYPE nodejs_nodejs_external_memory_bytes gauge
nodejs_nodejs_external_memory_bytes 3682751

# HELP nodejs_nodejs_heap_space_size_total_bytes Process heap space size total from Node.js in bytes.
# TYPE nodejs_nodejs_heap_space_size_total_bytes gauge
nodejs_nodejs_heap_space_size_total_bytes{space="read_only"} 180224
nodejs_nodejs_heap_space_size_total_bytes{space="old"} 6193152
nodejs_nodejs_heap_space_size_total_bytes{space="code"} 671744
nodejs_nodejs_heap_space_size_total_bytes{space="map"} 802816
nodejs_nodejs_heap_space_size_total_bytes{space="large_object"} 278528
nodejs_nodejs_heap_space_size_total_bytes{space="code_large_object"} 0
nodejs_nodejs_heap_space_size_total_bytes{space="new_large_object"} 0
nodejs_nodejs_heap_space_size_total_bytes{space="new"} 1048576

# HELP nodejs_nodejs_heap_space_size_used_bytes Process heap space size used from Node.js in bytes.
# TYPE nodejs_nodejs_heap_space_size_used_bytes gauge
nodejs_nodejs_heap_space_size_used_bytes{space="read_only"} 170936
nodejs_nodejs_heap_space_size_used_bytes{space="old"} 5955864
nodejs_nodejs_heap_space_size_used_bytes{space="code"} 516864
nodejs_nodejs_heap_space_size_used_bytes{space="map"} 682928
nodejs_nodejs_heap_space_size_used_bytes{space="large_object"} 262160
nodejs_nodejs_heap_space_size_used_bytes{space="code_large_object"} 0
nodejs_nodejs_heap_space_size_used_bytes{space="new_large_object"} 0
nodejs_nodejs_heap_space_size_used_bytes{space="new"} 710136

# HELP nodejs_nodejs_heap_space_size_available_bytes Process heap space size available from Node.js in bytes.
# TYPE nodejs_nodejs_heap_space_size_available_bytes gauge
nodejs_nodejs_heap_space_size_available_bytes{space="read_only"} 0
nodejs_nodejs_heap_space_size_available_bytes{space="old"} 123304
nodejs_nodejs_heap_space_size_available_bytes{space="code"} 7424
nodejs_nodejs_heap_space_size_available_bytes{space="map"} 102376
nodejs_nodejs_heap_space_size_available_bytes{space="large_object"} 0
nodejs_nodejs_heap_space_size_available_bytes{space="code_large_object"} 0
nodejs_nodejs_heap_space_size_available_bytes{space="new_large_object"} 1031072
nodejs_nodejs_heap_space_size_available_bytes{space="new"} 320936

# HELP nodejs_nodejs_version_info Node.js version info.
# TYPE nodejs_nodejs_version_info gauge
nodejs_nodejs_version_info{version="v16.16.0",major="16",minor="16",patch="0"} 1

# HELP nodejs_nodejs_gc_duration_seconds Garbage collection duration by kind, one of major, minor, incremental or weakcb.
# TYPE nodejs_nodejs_gc_duration_seconds histogram
nodejs_nodejs_gc_duration_seconds_bucket{le="0.001",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="0.01",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="0.1",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="1",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="2",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="5",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="+Inf",kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_sum{kind="incremental"} 0.0017222910001873971
nodejs_nodejs_gc_duration_seconds_count{kind="incremental"} 4
nodejs_nodejs_gc_duration_seconds_bucket{le="0.001",kind="major"} 0
nodejs_nodejs_gc_duration_seconds_bucket{le="0.01",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="0.1",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="1",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="2",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="5",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="+Inf",kind="major"} 2
nodejs_nodejs_gc_duration_seconds_sum{kind="major"} 0.0034922499991953374
nodejs_nodejs_gc_duration_seconds_count{kind="major"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="0.001",kind="minor"} 2
nodejs_nodejs_gc_duration_seconds_bucket{le="0.01",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_bucket{le="0.1",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_bucket{le="1",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_bucket{le="2",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_bucket{le="5",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_bucket{le="+Inf",kind="minor"} 3
nodejs_nodejs_gc_duration_seconds_sum{kind="minor"} 0.0028380829952657227
nodejs_nodejs_gc_duration_seconds_count{kind="minor"} 3
```

## promQL

PromQL(Prometheus Query Language)는 Prometheus에서 메트릭 데이터를 쿼리하기 위한 언어입니다. PromQL을 사용하면 시계열 데이터에 대한 복잡한 질의 및 연산을 수행할 수 있습니다.

### 몇 가지 기본 개념:

- **Instant Vector**: 특정 시점에서 시계열 데이터의 집합. 대부분의 메트릭 이름으로 질의하면 반환되는 결과.
- **Range Vector**: 특정 시간 범위에 대한 시계열 데이터의 집합. 예: `[5m]`은 최근 5분간의 데이터를 의미합니다.
- **Operators**: PromQL에는 기본 산술 연산자뿐만 아니라 비교 및 논리 연산자도 포함됩니다.
- **Functions**: PromQL에는 시계열 데이터를 처리하기 위한 다양한 함수가 포함되어 있습니다. 예: `rate()`, `sum()`, `avg()`, `histogram_quantile()` 등.
  - sum by(라벨) 매트릭
  - avg by(라벨) 매트릭
  - `rate` 함수는 주어진 시간 범위에 대한 메트릭의 평균 초당 증가율을 반환합니다.
  - irate: 시계열 데이터의 즉각적인 초당 증가율을 계산하는 데 사용됩니다. **가장 최근의 두 데이터 포인트**만을 사용하여 초당 증가율을 계산합니다.
  - 비교적으로, `rate` 함수는 주어진 시간 범위 내의 모든 데이터 포인트를 사용하여 평균 초당 증가율을 계산합니다. `rate`는 전반적인 트렌드나 안정된 증가율을 알아보는 데 더 적합합니다, 반면 `irate`는 빠른 변화를 감지하는 데 더 유용합니다.

### PromQL 예제:

1. **메트릭 조회**:

```
http_requests_total
```

2. **5분 동안의 요청 비율 계산**:

```
rate(http_requests_total[5m])
```

3. **서비스 별로 5분 동안의 요청 비율 계산**:

```
rate(http_requests_total{service=~".*"}[5m])
```

4. **평균 응답 지연 시간 계산**:

```
avg(http_response_time_seconds)
```

5. **5분 동안의 평균 응답 지연 시간 변화율 계산**:

```
rate(http_response_time_seconds_sum[5m]) / rate(http_response_time_seconds_count[5m])
```

6. **각 인스턴스의 CPU 사용률 조회**:

```
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

7. **시스템에 전체 메모리 대비 사용 가능한 메모리 비율 계산**:

```
(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

8. **5분 동안의 최대 응답 시간 계산**:

```
max_over_time(http_response_time_seconds[5m])
```

9. **서비스별로 모든 요청의 합계 계산**:

```
sum by(service) (http_requests_total)
```

10. **90% 지점에서의 응답 시간 계산 (Histogram 데이터를 사용할 때)**:

```
histogram_quantile(0.9, rate(http_response_time_seconds_bucket[5m]))
```

위의 예제들은 일반적인 사용 사례와 Prometheus에서 사용할 수 있는 다양한 기능을 보여주기 위한 것입니다. 실제 사용 사례에 따라 PromQL 쿼리는 다양하게 구성될 수 있습니다.

## Grafana

https://grafana.com/

Grafana는 오픈 소스 플랫폼으로, 시계열 데이터의 시각화 및 모니터링에 사용됩니다. Grafana를 사용하면 여러 데이터 소스에서 데이터를 가져와 다양한 형식의 대시보드를 구축할 수 있습니다. 주요 특징 및 기능은 다음과 같습니다:

### 주요 특징:

1. **다양한 데이터 소스 지원**: Grafana는 Prometheus, InfluxDB, Elasticsearch, Graphite, MySQL, PostgreSQL 등 다양한 데이터 소스를 지원합니다.
2. **대시보드 및 패널**: 사용자는 다양한 패널 타입(예: 그래프, 히트맵, 단일 숫자, 테이블 등)을 사용하여 대시보드를 구성할 수 있습니다.
3. **대화식 쿼리 빌더**: 각 데이터 소스에 대한 질의를 만들고 수정할 수 있는 대화식 쿼리 빌더를 제공합니다.
4. **경고**: 사용자는 특정 조건을 충족할 때 알림을 받을 수 있습니다. 알림은 Slack, Email, PagerDuty 등 다양한 채널로 전송될 수 있습니다.
5. **플러그인 시스템**: Grafana는 다양한 패널, 데이터 소스 및 앱을 위한 플러그인 시스템을 제공합니다. 커뮤니티에서 제작된 플러그인을 추가하거나 직접 플러그인을 개발할 수 있습니다.
6. **템플릿 및 변수**: 대시보드에 동적 변수를 추가하여 사용자가 선택할 수 있게 만들 수 있습니다. 예를 들어, 여러 서버의 메트릭을 시각화할 때 서버를 선택하는 드롭다운 메뉴를 추가할 수 있습니다.
7. **테마**: Grafana는 라이트 및 다크 테마를 지원하여 사용자의 선호에 맞게 대시보드의 모양을 변경할 수 있습니다.

### 사용 사례:

1. **인프라 모니터링**: 시스템의 CPU, 메모리, 디스크 사용량 등의 기본 메트릭을 시각화합니다.
2. **응용 프로그램 모니터링**: 응용 프로그램의 응답 시간, 에러율, 처리된 요청 수 등의 메트릭을 시각화합니다.
3. **로그 분석**: Elasticsearch와 같은 로깅 플랫폼과 통합하여 로그 데이터를 시각화합니다.
4. **IoT 데이터 시각화**: IoT 장치에서 수집된 데이터를 시각화합니다.

Grafana는 쉽게 사용할 수 있으며, 커뮤니티 지원이 활발하므로 많은 정보와 리소스를 찾을 수 있습니다.

## 대충 실습

기본 매트릭과 rps를 조회해보고, 그라파나에서 대시보드도 아주 간단하게 만들어보자.

- 서버: 8080
- 프로메테우스: 9090
- 그라파나: 3000

```bash
yarn start
prometheus --config.file=prometheus.yml
rate(http_total_requests[1m]) - 최근 1분 동안의 초당 요청 비율
brew services start grafana
```

## 앞으로 할 것

- 우리 그라파나 대시보드 promQL 어떻게 되어있을까?
- nodejs 매트릭들 자세히 알아보기
