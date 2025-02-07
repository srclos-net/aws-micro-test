const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Setup OpenTelemetry Tracing
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'lambda-microservice'
  })
});

const exporter = new OTLPTraceExporter({
  url: 'http://your-otel-collector-endpoint/v1/traces'
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

exports.handler = async (event, context) => {
  const tracer = provider.getTracer('lambda-microservice-tracer');
  const span = tracer.startSpan('lambda-handler');

  try {
    // Process users from ECS Fargate service
    span.addEvent('Processing user data');
    
    const processedUsers = await processUsers(event.users || []);
    
    span.setAttribute('users.processed_count', processedUsers.length);
    span.setAttribute('result.status', 'success');

    return {
      statusCode: 200,
      body: JSON.stringify(processedUsers)
    };
  } catch (error) {
    span.recordException(error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  } finally {
    span.end();
  }
};

async function processUsers(users) {
  const tracer = provider.getTracer('lambda-microservice-tracer');
  const span = tracer.startSpan('process-users');
  
  try {
    // Simulate user processing
    const processedUsers = users.map(user => ({
      ...user,
      processed: true,
      processedAt: new Date().toISOString()
    }));
    
    span.setAttribute('input.users_count', users.length);
    
    return processedUsers;
  } finally {
    span.end();
  }
}