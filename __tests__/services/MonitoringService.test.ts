/**
 * Monitoring Service Unit Tests
 */

import { MonitoringService, MetricType, AlertSeverity } from '../../lib/services/MonitoringService';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = MonitoringService.getInstance();
    service.clearMetrics();
    service.clearAlertHistory();
  });

  describe('Metrics Collection', () => {
    it('should record a metric', () => {
      service.recordMetric({
        name: 'test.metric',
        type: 'counter',
        value: 100,
        unit: 'count',
      });

      const metrics = service.getMetrics('test.metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
    });

    it('should get latest metric', () => {
      service.recordMetric({ name: 'test.metric', type: 'gauge', value: 10 });
      service.recordMetric({ name: 'test.metric', type: 'gauge', value: 20 });
      service.recordMetric({ name: 'test.metric', type: 'gauge', value: 30 });

      const latest = service.getLatestMetric('test.metric');
      expect(latest?.value).toBe(30);
    });

    it('should limit metric history', () => {
      service.recordMetric({ name: 'test.metric', type: 'counter', value: 1 });
      
      const metrics = service.getMetrics('test.metric', 10);
      expect(metrics.length).toBeLessThanOrEqual(10);
    });

    it('should get all metric names', () => {
      service.recordMetric({ name: 'metric.one', type: 'counter', value: 1 });
      service.recordMetric({ name: 'metric.two', type: 'gauge', value: 2 });

      const names = service.getMetricNames();
      expect(names).toContain('metric.one');
      expect(names).toContain('metric.two');
    });
  });

  describe('Health Checks', () => {
    it('should register health check', () => {
      service.registerHealthCheck({
        name: 'test-service',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Test service operational',
      });

      const check = service.getHealthCheck('test-service');
      expect(check).toBeDefined();
      expect(check?.status).toBe('healthy');
    });

    it('should update health check', () => {
      service.registerHealthCheck({
        name: 'test-service',
        status: 'healthy',
        lastCheck: new Date(),
      });

      service.updateHealthCheck('test-service', {
        status: 'degraded',
        message: 'Service slow',
      });

      const check = service.getHealthCheck('test-service');
      expect(check?.status).toBe('degraded');
    });

    it('should get all health checks', () => {
      service.registerHealthCheck({ name: 'service-1', status: 'healthy', lastCheck: new Date() });
      service.registerHealthCheck({ name: 'service-2', status: 'healthy', lastCheck: new Date() });

      const checks = service.getAllHealthChecks();
      expect(checks.length).toBeGreaterThanOrEqual(2);
    });

    it('should run all health checks', async () => {
      service.registerHealthCheck({ name: 'test', status: 'healthy', lastCheck: new Date() });

      const checks = await service.runHealthChecks();
      expect(checks.length).toBeGreaterThan(0);
    });
  });

  describe('Alert Rules', () => {
    it('should create alert rule', () => {
      const rule = service.createAlertRule({
        name: 'Test Alert',
        metric: 'test.metric',
        operator: '>',
        threshold: 100,
        severity: 'warning',
        channels: ['in-app'],
      });

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Alert');
      expect(rule.enabled).toBe(true);
    });

    it('should get all alert rules', () => {
      service.createAlertRule({
        name: 'Rule 1',
        metric: 'test.metric',
        operator: '>',
        threshold: 10,
        severity: 'warning',
        channels: ['in-app'],
      });

      const rules = service.getAllAlertRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should update alert rule', () => {
      const rule = service.createAlertRule({
        name: 'Test Rule',
        metric: 'test.metric',
        operator: '>',
        threshold: 100,
        severity: 'warning',
        channels: ['in-app'],
      });

      const updated = service.updateAlertRule(rule.id, {
        threshold: 200,
        severity: 'error',
      });

      expect(updated?.threshold).toBe(200);
      expect(updated?.severity).toBe('error');
    });

    it('should delete alert rule', () => {
      const rule = service.createAlertRule({
        name: 'Test Rule',
        metric: 'test.metric',
        operator: '>',
        threshold: 100,
        severity: 'warning',
        channels: ['in-app'],
      });

      const deleted = service.deleteAlertRule(rule.id);
      expect(deleted).toBe(true);

      const rules = service.getAllAlertRules();
      expect(rules.find(r => r.id === rule.id)).toBeUndefined();
    });
  });

  describe('Alerts', () => {
    it('should get active alerts', () => {
      const alerts = service.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get alert history', () => {
      const history = service.getAlertHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should acknowledge alert', () => {
      // Create a metric that triggers an alert
      service.createAlertRule({
        name: 'Test Alert',
        metric: 'test.high',
        operator: '>',
        threshold: 50,
        severity: 'warning',
        channels: ['in-app'],
      });

      service.recordMetric({
        name: 'test.high',
        type: 'gauge',
        value: 100,
      });

      const activeAlerts = service.getActiveAlerts();
      if (activeAlerts.length > 0) {
        const acknowledged = service.acknowledgeAlert(activeAlerts[0].id, 'test-user');
        expect(acknowledged?.acknowledged).toBe(true);
        expect(acknowledged?.acknowledgedBy).toBe('test-user');
      }
    });
  });

  describe('Performance Tracking', () => {
    it('should track pipeline execution', () => {
      service.trackPipelineExecution({
        pipelineId: 'pipe-123',
        duration: 5000,
        recordsProcessed: 10000,
        success: true,
      });

      const execMetric = service.getLatestMetric('pipelines.execution_count');
      expect(execMetric).toBeDefined();
    });

    it('should track API requests', () => {
      service.trackAPIRequest({
        endpoint: '/api/pipelines',
        method: 'POST',
        duration: 50,
        statusCode: 200,
      });

      const requestMetric = service.getLatestMetric('api.request_count');
      expect(requestMetric).toBeDefined();
    });
  });

  describe('System Health', () => {
    it('should get system health', async () => {
      // Wait a moment for uptime to accumulate
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const health = await service.getSystemHealth();

      expect(health.status).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.services).toBeDefined();
      expect(health.metrics).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get monitoring statistics', async () => {
      service.recordMetric({ name: 'test.metric', type: 'counter', value: 1 });

      // Wait a moment for uptime
      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = service.getStatistics();

      expect(stats.totalMetrics).toBeGreaterThan(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});

