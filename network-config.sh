#!/bin/sh

docker exec node1 tc qdisc add dev lo root netem delay 1000ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5% || true
docker exec node2 tc qdisc add dev lo root netem delay 1000ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5% || true
docker exec node3 tc qdisc add dev lo root netem delay 1000ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5% || true
docker exec node4 tc qdisc add dev lo root netem delay 1000ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5% || true
docker exec node5 tc qdisc add dev lo root netem delay 1000ms 50ms reorder 8% corrupt 5% duplicate 2% 5% loss 5% || true