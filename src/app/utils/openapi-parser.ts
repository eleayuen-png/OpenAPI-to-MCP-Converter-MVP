import SwaggerParser from '@apidevtools/swagger-parser';
import * as yaml from 'js-yaml';
import type { Endpoint } from '../components/EndpointList';

export async function parseOpenAPIFile(file: File): Promise<Endpoint[]> {
  const text = await file.text();
  let spec: any;

  try {
    // Try parsing as JSON first
    spec = JSON.parse(text);
  } catch {
    // If JSON fails, try YAML
    try {
      spec = yaml.load(text);
    } catch (error) {
      throw new Error('Invalid file format. Please provide a valid JSON or YAML file.');
    }
  }

  return await parseOpenAPISpec(spec);
}

export async function parseOpenAPIFromUrl(url: string): Promise<Endpoint[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  let spec: any;

  if (contentType.includes('application/json')) {
    spec = await response.json();
  } else if (contentType.includes('yaml') || contentType.includes('yml')) {
    const text = await response.text();
    spec = yaml.load(text);
  } else {
    // Try to auto-detect
    const text = await response.text();
    try {
      spec = JSON.parse(text);
    } catch {
      spec = yaml.load(text);
    }
  }

  return await parseOpenAPISpec(spec);
}

async function parseOpenAPISpec(spec: any): Promise<Endpoint[]> {
  // Validate and dereference the spec
  const api = await SwaggerParser.validate(spec);

  const endpoints: Endpoint[] = [];
  const paths = api.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

    for (const method of methods) {
      const operation = (pathItem as any)[method];
      if (operation) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary,
          operationId: operation.operationId,
          parameters: operation.parameters,
          requestBody: operation.requestBody,
          responses: operation.responses,
        });
      }
    }
  }

  return endpoints;
}
