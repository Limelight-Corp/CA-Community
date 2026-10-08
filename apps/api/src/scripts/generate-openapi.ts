import fs from 'node:fs';
import path from 'node:path';
import { generateOpenAPIDocument } from '@ascend/shared';
import YAML from 'yaml';

async function main() {
  const docsDir = path.resolve(process.cwd(), '../../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const spec = generateOpenAPIDocument();
  const jsonPath = path.join(docsDir, 'openapi.json');
  const yamlPath = path.join(docsDir, 'openapi.yaml');

  fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf-8');
  fs.writeFileSync(yamlPath, YAML.stringify(spec), 'utf-8');

  console.log(`OpenAPI specs generated successfully:`);
  console.log(`- ${jsonPath}`);
  console.log(`- ${yamlPath}`);
}

main().catch((err) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
