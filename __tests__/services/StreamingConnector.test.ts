/**
 * Streaming Connector Unit Tests
 */

import { StreamingConnector, StreamConfig } from '../../lib/services/StreamingConnector';

describe('StreamingConnector', () => {
  let connector: StreamingConnector;

  beforeEach(() => {
    connector = StreamingConnector.getInstance();
  });

  afterEach(async () => {
    await connector.shutdown();
  });

  describe('Stream Registration', () => {
    it('should register a Kafka stream', () => {
      const stream: StreamConfig = {
        id: 'kafka-1',
        name: 'Test Kafka',
        type: 'kafka',
        enabled: false, // Don't auto-connect in tests
        config: {
          brokers: ['localhost:9092'],
          topic: 'test-topic',
          groupId: 'test-group',
        },
      };

      connector.registerStream(stream);

      const registered = connector.getStream(stream.id);
      expect(registered).toBeDefined();
      expect(registered?.name).toBe('Test Kafka');
    });

    it('should register a RabbitMQ stream', () => {
      const stream: StreamConfig = {
        id: 'rabbitmq-1',
        name: 'Test RabbitMQ',
        type: 'rabbitmq',
        enabled: false,
        config: {
          host: 'localhost',
          port: 5672,
          username: 'guest',
          password: 'guest',
          queue: 'test-queue',
        },
      };

      connector.registerStream(stream);

      const registered = connector.getStream(stream.id);
      expect(registered).toBeDefined();
    });

    it('should register a WebSocket stream', () => {
      const stream: StreamConfig = {
        id: 'ws-1',
        name: 'Test WebSocket',
        type: 'websocket',
        enabled: false,
        config: {
          url: 'ws://localhost:8080',
          reconnectInterval: 5000,
        },
      };

      connector.registerStream(stream);

      const registered = connector.getStream(stream.id);
      expect(registered).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should initialize statistics for new streams', () => {
      const stream: StreamConfig = {
        id: 'test-1',
        name: 'Test Stream',
        type: 'kafka',
        enabled: false,
        config: {
          brokers: ['localhost:9092'],
          topic: 'test',
          groupId: 'test',
        },
      };

      connector.registerStream(stream);

      const stats = connector.getStats(stream.id);
      expect(stats).toBeDefined();
      expect(stats?.messagesReceived).toBe(0);
      expect(stats?.messagesProcessed).toBe(0);
      expect(stats?.status).toBe('disconnected');
    });

    it('should get all statistics', () => {
      const stream1: StreamConfig = {
        id: 'stream-1',
        name: 'Stream 1',
        type: 'kafka',
        enabled: false,
        config: { brokers: ['localhost:9092'], topic: 'test', groupId: 'test' },
      };

      const stream2: StreamConfig = {
        id: 'stream-2',
        name: 'Stream 2',
        type: 'websocket',
        enabled: false,
        config: { url: 'ws://localhost:8080' },
      };

      connector.registerStream(stream1);
      connector.registerStream(stream2);

      const allStats = connector.getAllStats();
      expect(allStats.length).toBeGreaterThanOrEqual(2);
    });
  });
});

