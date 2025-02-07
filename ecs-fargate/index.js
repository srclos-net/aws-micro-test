const express = require('express');
const axios = require('axios');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Setup OpenTelemetry Tracing
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ecs-microservice'
  })
});

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_ENDPOINT || 'http://your-otel-collector-endpoint/v1/traces',
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

// Create Express App
const app = express();
const PORT = process.env.PORT || 3000;
const LAMBDA_ENDPOINT = process.env.LAMBDA_ENDPOINT || 'https://your-lambda-endpoint';

// Middleware to create spans
app.use((req, res, next) => {
  const tracer = provider.getTracer('ecs-microservice-tracer');
  const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`);
  req.span = span;
  
  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.end();
  });
  
  next();
});

// Endpoint that calls Lambda function
app.get('/process-users', async (req, res) => {
  const tracer = provider.getTracer('ecs-microservice-tracer');
  const span = tracer.startSpan('process-users');
  
  try {
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];
    
    // Call Lambda function
    const lambdaResponse = await axios.post(LAMBDA_ENDPOINT, { users });
    
    span.setAttribute('users.count', users.length);
    span.setAttribute('lambda.response_status', lambdaResponse.status);
    
    res.json({
      users: users,
      lambdaResult: lambdaResponse.data
    });
  } catch (error) {
    span.recordException(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    span.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ECS Microservice running on port ${PORT}`);
});