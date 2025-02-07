# aws-micro-test

Why do this? This is a test to see what kind of data we can pull from serverless environments, and how we can best display that in Grafana

## ECS Component

This is the entrypoint. The ECS component talks to the lambda component. Traces should be nested.

## Lambda Component

The lambda component receives requests from the ECS component.
