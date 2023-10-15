import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  vus: 10, // 10 virtual users
  duration: "30s", // for 30 seconds
};

export default function () {
  const n = Math.floor(Math.random() * 30) + 1; // 1부터 30까지의 랜덤 숫자
  const res = http.get(`http://localhost:8080/fibonacci/${n}`);

  // Check if the response was successful (status code 200)
  check(res, {
    "is status 200": (r) => r.status === 200,
  });

  // Sleep for a short amount of time before the next request. This may not be strictly necessary depending on the exact request frequency desired.
  sleep(0.06); // Sleep for 60ms
}
