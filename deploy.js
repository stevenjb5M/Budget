#!/usr/bin/env node

/**
 * Budget Planner AWS Deployment Script
 * Builds and deploys Lambda backend and React frontend to AWS
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, description) {
  try {
    log(`\n▶ ${description}`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    log(`✓ ${description} complete`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    throw error;
  }
}

async function uploadFilesToS3(bucketName, distributionId) {
  log('\n▶ Uploading frontend to S3', 'blue');

  const s3Client = new S3Client({ region: 'us-east-1' });
  const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

  if (!fs.existsSync(frontendDistPath)) {
    throw new Error('Frontend dist folder not found. Run npm run build in frontend directory.');
  }

  // Check if bucket exists
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    throw new Error(`S3 bucket "${bucketName}" does not exist or is not accessible.`);
  }

  // Upload all files recursively
  const files = getAllFiles(frontendDistPath);
  let uploadedCount = 0;

  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath);
    const key = path.relative(frontendDistPath, filePath);
    const contentType = getContentType(filePath);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: filePath.endsWith('.html') ? 'max-age=0' : 'max-age=31536000',
      })
    );

    uploadedCount++;
    process.stdout.write(`\rUploaded: ${uploadedCount}/${files.length} files`);
  }

  log(`\n✓ Frontend uploaded to S3`, 'green');

  // Invalidate CloudFront cache
  if (distributionId) {
    log('▶ Invalidating CloudFront cache', 'blue');
    const cfClient = new CloudFrontClient({ region: 'us-east-1' });

    await cfClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/*'],
          },
          CallerReference: Date.now().toString(),
        },
      })
    );

    log('✓ CloudFront cache invalidated', 'green');
  }
}

function getAllFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

function getTerraformOutputs() {
  try {
    const output = execSync('cd terraform && terraform output -json', { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (error) {
    log('⚠ Could not read Terraform outputs', 'yellow');
    return null;
  }
}

async function main() {
  try {
    log('\n========================================', 'blue');
    log('  Budget Planner AWS Deployment', 'blue');
    log('========================================\n', 'blue');

    // Check prerequisites
    log('▶ Checking prerequisites', 'blue');
    const checks = [
      { cmd: 'node --version', name: 'Node.js' },
      { cmd: 'aws --version', name: 'AWS CLI' },
      { cmd: 'terraform --version', name: 'Terraform' },
    ];

    for (const check of checks) {
      try {
        execSync(check.cmd, { stdio: 'ignore' });
        log(`  ✓ ${check.name}`, 'green');
      } catch {
        throw new Error(`${check.name} is not installed`);
      }
    }

    // Build backend
    await runCommand('cd lambda && npm install && npm run build', 'Building Lambda functions');
    await runCommand(
      'cd lambda && npm run package',
      'Packaging Lambda functions'
    );
    
    // Move Lambda ZIP to terraform directory
    execSync('mv lambda/lambda-functions.zip terraform/', { stdio: 'inherit' });

    // Build frontend
    await runCommand('cd frontend && npm install', 'Installing frontend dependencies');
    await runCommand('cd frontend && npm run build', 'Building frontend');

    // Deploy infrastructure
    await runCommand(
      'cd terraform && terraform init',
      'Initializing Terraform'
    );
    await runCommand(
      'cd terraform && terraform validate',
      'Validating Terraform configuration'
    );
    await runCommand(
      'cd terraform && terraform apply -auto-approve',
      'Deploying infrastructure with Terraform'
    );

    // Get outputs and upload frontend
    const outputs = getTerraformOutputs();
    if (outputs && outputs.frontend_bucket_name && outputs.frontend_bucket_name.value) {
      const bucketName = outputs.frontend_bucket_name.value;
      const distributionId = outputs.cloudfront_distribution_id?.value;

      await uploadFilesToS3(bucketName, distributionId);
    }

    // Print summary
    log('\n========================================', 'green');
    log('  ✓ Deployment Complete!', 'green');
    log('========================================\n', 'green');

    if (outputs) {
      log('Deployment Summary:', 'blue');
      if (outputs.api_gateway_url?.value) {
        log(`  API URL: ${outputs.api_gateway_url.value}`);
      }
      if (outputs.cloudfront_distribution_url?.value) {
        log(`  Frontend URL: ${outputs.cloudfront_distribution_url.value}`);
      }
      if (outputs.frontend_bucket_name?.value) {
        log(`  S3 Bucket: ${outputs.frontend_bucket_name.value}`);
      }
    }

    log('\nYour Budget Planner is now live on AWS! 🎉\n', 'green');
  } catch (error) {
    log(`\n✗ Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
