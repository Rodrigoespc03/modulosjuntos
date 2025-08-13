#!/usr/bin/env ts-node

/**
 * 🚀 DEMO DEVOPS & CI/CD - FASE 4.4
 * Sistema Procura - Validación completa de DevOps
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface DevOpsValidation {
  docker: boolean;
  dockerCompose: boolean;
  githubActions: boolean;
  monitoring: boolean;
  deployment: boolean;
  security: boolean;
}

interface ValidationResult {
  component: string;
  status: '✅ PASS' | '❌ FAIL' | '⚠️ WARNING';
  details: string;
  recommendations?: string[];
}

class DevOpsValidator {
  private results: ValidationResult[] = [];

  async validateCompleteDevOps(): Promise<void> {
    console.log('🚀 === DEVOPS & CI/CD VALIDATION DEMO ===\n');

    // Validar Docker
    await this.validateDocker();
    
    // Validar Docker Compose
    await this.validateDockerCompose();
    
    // Validar GitHub Actions
    await this.validateGitHubActions();
    
    // Validar Monitoring Stack
    await this.validateMonitoringStack();
    
    // Validar Deployment Scripts
    await this.validateDeploymentScripts();
    
    // Validar Security
    await this.validateSecurity();
    
    // Generar reporte final
    this.generateFinalReport();
  }

  private async validateDocker(): Promise<void> {
    console.log('🐳 === VALIDATING DOCKER ===');
    
    // Verificar Dockerfile
    const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      
      const checks = [
        { name: 'Multi-stage build', pattern: /FROM.*AS.*builder/, required: true },
        { name: 'Security user', pattern: /USER procura/, required: true },
        { name: 'Health check', pattern: /HEALTHCHECK/, required: true },
        { name: 'Non-root user', pattern: /adduser.*procura/, required: true },
        { name: 'Dumb-init', pattern: /dumb-init/, required: true }
      ];

      checks.forEach(check => {
        const hasFeature = check.pattern.test(dockerfileContent);
        this.results.push({
          component: `Docker: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Feature implemented correctly' : 'Feature missing or incorrect'
        });
      });
    } else {
      this.results.push({
        component: 'Docker: Dockerfile',
        status: '❌ FAIL',
        details: 'Dockerfile not found'
      });
    }

    // Verificar .dockerignore
    const dockerignorePath = path.join(__dirname, '..', '.dockerignore');
    if (fs.existsSync(dockerignorePath)) {
      const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
      const hasNodeModules = dockerignoreContent.includes('node_modules');
      const hasLogs = dockerignoreContent.includes('logs');
      const hasTests = dockerignoreContent.includes('tests');
      
      this.results.push({
        component: 'Docker: .dockerignore',
        status: hasNodeModules && hasLogs && hasTests ? '✅ PASS' : '⚠️ WARNING',
        details: `Optimization: node_modules=${hasNodeModules}, logs=${hasLogs}, tests=${hasTests}`,
        recommendations: !hasNodeModules ? ['Add node_modules to .dockerignore'] : undefined
      });
    }
  }

  private async validateDockerCompose(): Promise<void> {
    console.log('🐳 === VALIDATING DOCKER COMPOSE ===');
    
    const composePath = path.join(__dirname, '..', 'docker-compose.yml');
    if (fs.existsSync(composePath)) {
      const composeContent = fs.readFileSync(composePath, 'utf8');
      
      const checks = [
        { name: 'Backend service', pattern: /backend:/, required: true },
        { name: 'PostgreSQL service', pattern: /postgres:/, required: true },
        { name: 'Redis service', pattern: /redis:/, required: true },
        { name: 'Prometheus service', pattern: /prometheus:/, required: true },
        { name: 'Grafana service', pattern: /grafana:/, required: true },
        { name: 'Health checks', pattern: /healthcheck:/, required: true },
        { name: 'Networks', pattern: /networks:/, required: true },
        { name: 'Volumes', pattern: /volumes:/, required: true }
      ];

      checks.forEach(check => {
        const hasFeature = check.pattern.test(composeContent);
        this.results.push({
          component: `Docker Compose: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Service configured correctly' : 'Service missing or incorrect'
        });
      });
    } else {
      this.results.push({
        component: 'Docker Compose: docker-compose.yml',
        status: '❌ FAIL',
        details: 'docker-compose.yml not found'
      });
    }
  }

  private async validateGitHubActions(): Promise<void> {
    console.log('🚀 === VALIDATING GITHUB ACTIONS ===');
    
    const workflowsPath = path.join(__dirname, '..', '.github', 'workflows');
    if (fs.existsSync(workflowsPath)) {
      const workflowFiles = fs.readdirSync(workflowsPath);
      const hasMainWorkflow = workflowFiles.some(file => file.includes('ci-cd'));
      
      if (hasMainWorkflow) {
        const workflowPath = path.join(workflowsPath, workflowFiles.find(f => f.includes('ci-cd'))!);
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        
        const checks = [
          { name: 'Linting job', pattern: /lint-and-validate:/, required: true },
          { name: 'Testing job', pattern: /test:/, required: true },
          { name: 'Build job', pattern: /build:/, required: true },
          { name: 'Deploy staging', pattern: /deploy-staging:/, required: true },
          { name: 'Deploy production', pattern: /deploy-production:/, required: true },
          { name: 'Security scan', pattern: /security-scan:/, required: true },
          { name: 'Docker build', pattern: /docker\/build-push-action/, required: true },
          { name: 'Environment protection', pattern: /environment:/, required: true }
        ];

        checks.forEach(check => {
          const hasFeature = check.pattern.test(workflowContent);
          this.results.push({
            component: `GitHub Actions: ${check.name}`,
            status: hasFeature ? '✅ PASS' : '❌ FAIL',
            details: hasFeature ? 'Job configured correctly' : 'Job missing or incorrect'
          });
        });
      } else {
        this.results.push({
          component: 'GitHub Actions: Main workflow',
          status: '❌ FAIL',
          details: 'CI/CD workflow not found'
        });
      }
    } else {
      this.results.push({
        component: 'GitHub Actions: Workflows directory',
        status: '❌ FAIL',
        details: '.github/workflows directory not found'
      });
    }
  }

  private async validateMonitoringStack(): Promise<void> {
    console.log('📊 === VALIDATING MONITORING STACK ===');
    
    // Verificar Prometheus
    const prometheusPath = path.join(__dirname, '..', 'monitoring', 'prometheus.yml');
    if (fs.existsSync(prometheusPath)) {
      const prometheusContent = fs.readFileSync(prometheusPath, 'utf8');
      
      const checks = [
        { name: 'Backend metrics', pattern: /procura-backend/, required: true },
        { name: 'Database metrics', pattern: /postgres/, required: true },
        { name: 'Cache metrics', pattern: /redis/, required: true },
        { name: 'Scrape intervals', pattern: /scrape_interval:/, required: true },
        { name: 'Alerting config', pattern: /alerting:/, required: true }
      ];

      checks.forEach(check => {
        const hasFeature = check.pattern.test(prometheusContent);
        this.results.push({
          component: `Prometheus: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Configuration correct' : 'Configuration missing'
        });
      });
    } else {
      this.results.push({
        component: 'Prometheus: Configuration',
        status: '❌ FAIL',
        details: 'prometheus.yml not found'
      });
    }

    // Verificar Alert Rules
    const alertsPath = path.join(__dirname, '..', 'monitoring', 'rules', 'alerts.yml');
    if (fs.existsSync(alertsPath)) {
      const alertsContent = fs.readFileSync(alertsPath, 'utf8');
      
      const checks = [
        { name: 'Backend alerts', pattern: /procura-backend-alerts/, required: true },
        { name: 'Database alerts', pattern: /procura-database-alerts/, required: true },
        { name: 'Security alerts', pattern: /procura-security-alerts/, required: true },
        { name: 'Business alerts', pattern: /procura-business-alerts/, required: true }
      ];

      checks.forEach(check => {
        const hasFeature = check.pattern.test(alertsContent);
        this.results.push({
          component: `Alert Rules: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Alert rules configured' : 'Alert rules missing'
        });
      });
    } else {
      this.results.push({
        component: 'Alert Rules: Configuration',
        status: '❌ FAIL',
        details: 'alerts.yml not found'
      });
    }
  }

  private async validateDeploymentScripts(): Promise<void> {
    console.log('🚀 === VALIDATING DEPLOYMENT SCRIPTS ===');
    
    const deployScriptPath = path.join(__dirname, '..', 'scripts', 'deploy.sh');
    if (fs.existsSync(deployScriptPath)) {
      const scriptContent = fs.readFileSync(deployScriptPath, 'utf8');
      
      const checks = [
        { name: 'Backup functionality', pattern: /create_backup/, required: true },
        { name: 'Health checks', pattern: /verify_deployment/, required: true },
        { name: 'Rollback capability', pattern: /rollback/, required: true },
        { name: 'Environment validation', pattern: /validate_environment/, required: true },
        { name: 'Monitoring setup', pattern: /setup_monitoring/, required: true },
        { name: 'Cleanup functionality', pattern: /cleanup/, required: true },
        { name: 'Error handling', pattern: /set -e/, required: true },
        { name: 'Logging functions', pattern: /log_/, required: true }
      ];

      checks.forEach(check => {
        const hasFeature = check.pattern.test(scriptContent);
        this.results.push({
          component: `Deployment Script: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Function implemented' : 'Function missing'
        });
      });
    } else {
      this.results.push({
        component: 'Deployment Script: deploy.sh',
        status: '❌ FAIL',
        details: 'deploy.sh not found'
      });
    }
  }

  private async validateSecurity(): Promise<void> {
    console.log('🔒 === VALIDATING SECURITY ===');
    
    // Verificar Dockerfile security
    const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
      
      const securityChecks = [
        { name: 'Non-root user', pattern: /USER procura/, required: true },
        { name: 'Dumb-init', pattern: /dumb-init/, required: true },
        { name: 'Multi-stage build', pattern: /FROM.*AS.*production/, required: true },
        { name: 'Health checks', pattern: /HEALTHCHECK/, required: true }
      ];

      securityChecks.forEach(check => {
        const hasFeature = check.pattern.test(dockerfileContent);
        this.results.push({
          component: `Security: ${check.name}`,
          status: hasFeature ? '✅ PASS' : '❌ FAIL',
          details: hasFeature ? 'Security feature implemented' : 'Security feature missing'
        });
      });
    }

    // Verificar GitHub Actions security
    const workflowsPath = path.join(__dirname, '..', '.github', 'workflows');
    if (fs.existsSync(workflowsPath)) {
      const workflowFiles = fs.readdirSync(workflowsPath);
      const mainWorkflow = workflowFiles.find(f => f.includes('ci-cd'));
      
      if (mainWorkflow) {
        const workflowPath = path.join(workflowsPath, mainWorkflow);
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        
        const securityChecks = [
          { name: 'Security audit', pattern: /npm audit/, required: true },
          { name: 'Trivy scan', pattern: /trivy-action/, required: true },
          { name: 'Environment secrets', pattern: /secrets\./, required: true },
          { name: 'SSH key protection', pattern: /ssh-agent/, required: true }
        ];

        securityChecks.forEach(check => {
          const hasFeature = check.pattern.test(workflowContent);
          this.results.push({
            component: `CI/CD Security: ${check.name}`,
            status: hasFeature ? '✅ PASS' : '❌ FAIL',
            details: hasFeature ? 'Security check implemented' : 'Security check missing'
          });
        });
      }
    }
  }

  private generateFinalReport(): void {
    console.log('\n📊 === FINAL DEVOPS VALIDATION REPORT ===\n');

    const totalChecks = this.results.length;
    const passedChecks = this.results.filter(r => r.status === '✅ PASS').length;
    const failedChecks = this.results.filter(r => r.status === '❌ FAIL').length;
    const warnings = this.results.filter(r => r.status === '⚠️ WARNING').length;

    // Mostrar resultados por categoría
    const categories = ['Docker', 'Docker Compose', 'GitHub Actions', 'Prometheus', 'Alert Rules', 'Deployment Script', 'Security'];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.component.startsWith(category));
      const passed = categoryResults.filter(r => r.status === '✅ PASS').length;
      const total = categoryResults.length;
      
      console.log(`${category}: ${passed}/${total} ✅`);
    });

    console.log('\n📋 === DETAILED RESULTS ===\n');

    this.results.forEach(result => {
      console.log(`${result.status} ${result.component}`);
      console.log(`   ${result.details}`);
      if (result.recommendations) {
        result.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
      }
      console.log('');
    });

    // Calcular score
    const score = Math.round((passedChecks / totalChecks) * 100);
    let grade = '';
    let status = '';

    if (score >= 95) {
      grade = 'A+';
      status = 'EXCELENTE - DevOps completamente implementado';
    } else if (score >= 90) {
      grade = 'A';
      status = 'MUY BUENO - DevOps bien implementado';
    } else if (score >= 80) {
      grade = 'B+';
      status = 'BUENO - DevOps implementado con algunas mejoras';
    } else if (score >= 70) {
      grade = 'B';
      status = 'ACEPTABLE - DevOps básico implementado';
    } else {
      grade = 'C';
      status = 'REQUIERE MEJORAS - DevOps incompleto';
    }

    console.log('🏆 === FINAL SCORE ===');
    console.log(`📊 Score: ${score}/100 (${grade})`);
    console.log(`📈 Status: ${status}`);
    console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
    console.log(`❌ Failed: ${failedChecks}/${totalChecks}`);
    console.log(`⚠️ Warnings: ${warnings}/${totalChecks}`);

    // Recomendaciones finales
    if (failedChecks > 0) {
      console.log('\n💡 === RECOMENDACIONES ===');
      const failedResults = this.results.filter(r => r.status === '❌ FAIL');
      failedResults.slice(0, 5).forEach(result => {
        console.log(`   • Fix: ${result.component} - ${result.details}`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ === DEVOPS & CI/CD VALIDATION COMPLETED ===');
    console.log('='.repeat(50));
  }
}

// Ejecutar validación
async function runDevOpsValidation() {
  const validator = new DevOpsValidator();
  await validator.validateCompleteDevOps();
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  runDevOpsValidation().catch(console.error);
}

export { DevOpsValidator, runDevOpsValidation };



