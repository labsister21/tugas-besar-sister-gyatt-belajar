#!/bin/sh

docker exec node1 tc qdisc del dev lo root || true
docker exec node2 tc qdisc del dev lo root || true
docker exec node3 tc qdisc del dev lo root || true
docker exec node4 tc qdisc del dev lo root || true
docker exec node5 tc qdisc del dev lo root || true