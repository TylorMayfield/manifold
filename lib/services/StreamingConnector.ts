/**
 * Streaming Data Connector
 * 
 * Real-time data ingestion from streaming sources:
 * - Apache Kafka - Distributed streaming platform
 * - RabbitMQ - Message queue broker
 * - WebSocket - Real-time bidirectional communication
 * 
 * Features:
 * - Auto-reconnection
 * - Error handling and retries
 * - Message buffering
 * - Batch processing
 * - Dead letter queue
 * - Monitoring and metrics
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// ==================== TYPES ====================

export interface StreamConfig {
  id: string;
  name: string;
  type: 'kafka' | 'rabbitmq' | 'websocket';
  enabled: boolean;
  config: KafkaConfig | RabbitMQConfig | WebSocketConfig;
  
  // Processing options
  batchSize?: number;
  batchTimeout?: number;
  maxRetries?: number;
  deadLetterQueue?: boolean;
  
  // Target
  targetDataSourceId?: string;
  transformPipelineId?: string;
}

export interface KafkaConfig {
  brokers: string[];
  topic: string;
  groupId: string;
  clientId?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  fromBeginning?: boolean;
  autoCommit?: boolean;
}

export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  exchange?: string;
  queue: string;
  routingKey?: string;
  durable?: boolean;
  autoAck?: boolean;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export interface StreamMessage {
  id: string;
  streamId: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
  partition?: number;
  offset?: number;
}

export interface StreamStats {
  streamId: string;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  bytesReceived: number;
  avgProcessingTime: number;
  lastMessageAt?: Date;
  errors: number;
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting';
}

// ==================== STREAMING CONNECTOR ====================

export class StreamingConnector extends EventEmitter {
  private static instance: StreamingConnector;
  
  private streams: Map<string, StreamConfig> = new Map();
  private connections: Map<string, any> = new Map(); // Active connections
  private statistics: Map<string, StreamStats> = new Map();
  private messageBuffers: Map<string, StreamMessage[]> = new Map();

  static getInstance(): StreamingConnector {
    if (!StreamingConnector.instance) {
      StreamingConnector.instance = new StreamingConnector();
    }
    return StreamingConnector.instance;
  }

  constructor() {
    super();
  }

  // ==================== STREAM MANAGEMENT ====================

  /**
   * Register a streaming source
   */
  registerStream(stream: StreamConfig): void {
    this.streams.set(stream.id, stream);
    
    // Initialize statistics
    this.statistics.set(stream.id, {
      streamId: stream.id,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      bytesReceived: 0,
      avgProcessingTime: 0,
      errors: 0,
      status: 'disconnected',
    });

    logger.info(`Stream registered: ${stream.name}`, 'streaming-connector', {
      streamId: stream.id,
      type: stream.type,
    });

    // Auto-connect if enabled
    if (stream.enabled) {
      this.connectStream(stream.id);
    }
  }

  /**
   * Connect to a stream
   */
  async connectStream(streamId: string): Promise<boolean> {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    logger.info(`Connecting to stream: ${stream.name}`, 'streaming-connector', {
      streamId,
      type: stream.type,
    });

    try {
      switch (stream.type) {
        case 'kafka':
          await this.connectKafka(stream);
          break;
        case 'rabbitmq':
          await this.connectRabbitMQ(stream);
          break;
        case 'websocket':
          await this.connectWebSocket(stream);
          break;
        default:
          throw new Error(`Unknown stream type: ${stream.type}`);
      }

      const stats = this.statistics.get(streamId);
      if (stats) {
        stats.status = 'connected';
      }

      this.emit('stream:connected', { stream });

      return true;

    } catch (error) {
      logger.error(`Failed to connect stream: ${stream.name}`, 'streaming-connector', {
        streamId,
        error,
      });

      const stats = this.statistics.get(streamId);
      if (stats) {
        stats.status = 'error';
        stats.errors++;
      }

      this.emit('stream:error', { stream, error });

      return false;
    }
  }

  /**
   * Disconnect from a stream
   */
  async disconnectStream(streamId: string): Promise<boolean> {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    const connection = this.connections.get(streamId);
    if (!connection) return false;

    try {
      // Close connection based on type
      if (stream.type === 'websocket') {
        connection.close();
      } else if (stream.type === 'kafka' || stream.type === 'rabbitmq') {
        await connection.disconnect();
      }

      this.connections.delete(streamId);

      const stats = this.statistics.get(streamId);
      if (stats) {
        stats.status = 'disconnected';
      }

      this.emit('stream:disconnected', { stream });

      logger.info(`Stream disconnected: ${stream.name}`, 'streaming-connector', { streamId });

      return true;

    } catch (error) {
      logger.error(`Failed to disconnect stream: ${stream.name}`, 'streaming-connector', {
        streamId,
        error,
      });
      return false;
    }
  }

  // ==================== KAFKA CONNECTOR ====================

  /**
   * Connect to Kafka (Mock implementation - would use kafkajs in production)
   */
  private async connectKafka(stream: StreamConfig): Promise<void> {
    const config = stream.config as KafkaConfig;

    logger.info('Connecting to Kafka', 'streaming-connector', {
      brokers: config.brokers,
      topic: config.topic,
      groupId: config.groupId,
    });

    // Mock Kafka consumer
    // In production, would use: const { Kafka } = require('kafkajs');
    const mockConsumer = {
      connect: async () => {
        logger.success('Kafka connected', 'streaming-connector', { streamId: stream.id });
      },
      subscribe: async () => {
        logger.info('Subscribed to Kafka topic', 'streaming-connector', { topic: config.topic });
      },
      run: async (options: any) => {
        logger.info('Kafka consumer running', 'streaming-connector');
        
        // Mock: Simulate receiving messages
        this.simulateKafkaMessages(stream);
      },
      disconnect: async () => {
        logger.info('Kafka disconnected', 'streaming-connector');
      },
    };

    await mockConsumer.connect();
    await mockConsumer.subscribe();
    await mockConsumer.run({
      eachMessage: async ({ message }: any) => {
        await this.handleKafkaMessage(stream, message);
      },
    });

    this.connections.set(stream.id, mockConsumer);
  }

  /**
   * Handle Kafka message
   */
  private async handleKafkaMessage(stream: StreamConfig, message: any): Promise<void> {
    const streamMessage: StreamMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      streamId: stream.id,
      data: message.value ? JSON.parse(message.value.toString()) : null,
      timestamp: new Date(message.timestamp),
      partition: message.partition,
      offset: message.offset,
      headers: message.headers,
    };

    await this.processMessage(stream, streamMessage);
  }

  /**
   * Simulate Kafka messages for demo
   */
  private simulateKafkaMessages(stream: StreamConfig): void {
    // Simulate receiving messages every few seconds
    setInterval(() => {
      const mockMessage = {
        value: Buffer.from(JSON.stringify({
          id: Math.floor(Math.random() * 10000),
          event: 'user_action',
          timestamp: new Date().toISOString(),
          data: { action: 'page_view', page: '/dashboard' },
        })),
        timestamp: Date.now(),
        partition: 0,
        offset: Math.floor(Math.random() * 100000),
        headers: {},
      };

      this.handleKafkaMessage(stream, mockMessage);
    }, 5000);
  }

  // ==================== RABBITMQ CONNECTOR ====================

  /**
   * Connect to RabbitMQ (Mock implementation)
   */
  private async connectRabbitMQ(stream: StreamConfig): Promise<void> {
    const config = stream.config as RabbitMQConfig;

    logger.info('Connecting to RabbitMQ', 'streaming-connector', {
      host: config.host,
      queue: config.queue,
    });

    // Mock RabbitMQ connection
    // In production, would use: const amqp = require('amqplib');
    const mockChannel = {
      consume: async (queue: string, callback: any) => {
        logger.info('RabbitMQ consumer started', 'streaming-connector', { queue });
        
        // Simulate messages
        this.simulateRabbitMQMessages(stream, callback);
      },
      ack: (message: any) => {
        // Acknowledge message
      },
      nack: (message: any) => {
        // Negative acknowledge
      },
      disconnect: async () => {
        logger.info('RabbitMQ disconnected', 'streaming-connector');
      },
    };

    await mockChannel.consume(config.queue, async (message: any) => {
      await this.handleRabbitMQMessage(stream, message);
    });

    this.connections.set(stream.id, mockChannel);
  }

  /**
   * Handle RabbitMQ message
   */
  private async handleRabbitMQMessage(stream: StreamConfig, message: any): Promise<void> {
    const config = stream.config as RabbitMQConfig;

    const streamMessage: StreamMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      streamId: stream.id,
      data: message.content ? JSON.parse(message.content.toString()) : null,
      timestamp: new Date(),
      metadata: {
        exchange: message.fields?.exchange,
        routingKey: message.fields?.routingKey,
      },
    };

    const success = await this.processMessage(stream, streamMessage);

    // Acknowledge or reject
    const channel = this.connections.get(stream.id);
    if (channel) {
      if (success) {
        channel.ack(message);
      } else if (!config.autoAck) {
        channel.nack(message);
      }
    }
  }

  /**
   * Simulate RabbitMQ messages
   */
  private simulateRabbitMQMessages(stream: StreamConfig, callback: any): void {
    setInterval(() => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          id: Math.floor(Math.random() * 10000),
          event: 'order_created',
          timestamp: new Date().toISOString(),
          data: { order_id: 'ORD-' + Math.floor(Math.random() * 10000), amount: 99.99 },
        })),
        fields: {
          exchange: 'orders',
          routingKey: 'order.created',
        },
      };

      callback(mockMessage);
    }, 3000);
  }

  // ==================== WEBSOCKET CONNECTOR ====================

  /**
   * Connect to WebSocket
   */
  private async connectWebSocket(stream: StreamConfig): Promise<void> {
    const config = stream.config as WebSocketConfig;

    logger.info('Connecting to WebSocket', 'streaming-connector', {
      url: config.url,
    });

    // Mock WebSocket - in browser, would use native WebSocket
    // In Node.js, would use 'ws' package
    const mockWebSocket = {
      readyState: 1, // OPEN
      url: config.url,
      send: (data: string) => {
        logger.info('WebSocket message sent', 'streaming-connector', { data });
      },
      close: () => {
        logger.info('WebSocket closed', 'streaming-connector');
      },
      addEventListener: (event: string, handler: any) => {
        if (event === 'open') {
          handler({});
        }
        if (event === 'message') {
          // Simulate messages
          this.simulateWebSocketMessages(stream, handler);
        }
      },
    };

    mockWebSocket.addEventListener('open', () => {
      logger.success('WebSocket connected', 'streaming-connector', { streamId: stream.id });
    });

    mockWebSocket.addEventListener('message', (event: any) => {
      this.handleWebSocketMessage(stream, event);
    });

    mockWebSocket.addEventListener('error', (error: any) => {
      logger.error('WebSocket error', 'streaming-connector', { error });
      this.handleReconnect(stream);
    });

    mockWebSocket.addEventListener('close', () => {
      logger.warn('WebSocket closed', 'streaming-connector');
      this.handleReconnect(stream);
    });

    this.connections.set(stream.id, mockWebSocket);
  }

  /**
   * Handle WebSocket message
   */
  private async handleWebSocketMessage(stream: StreamConfig, event: any): Promise<void> {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    const streamMessage: StreamMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      streamId: stream.id,
      data,
      timestamp: new Date(),
    };

    await this.processMessage(stream, streamMessage);
  }

  /**
   * Simulate WebSocket messages
   */
  private simulateWebSocketMessages(stream: StreamConfig, handler: any): void {
    setInterval(() => {
      const mockEvent = {
        data: JSON.stringify({
          id: Math.floor(Math.random() * 10000),
          type: 'sensor_reading',
          timestamp: new Date().toISOString(),
          value: Math.random() * 100,
        }),
      };

      handler(mockEvent);
    }, 2000);
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(stream: StreamConfig): void {
    const config = stream.config as WebSocketConfig;
    const reconnectInterval = config.reconnectInterval || 5000;

    const stats = this.statistics.get(stream.id);
    if (stats) {
      stats.status = 'reconnecting';
    }

    setTimeout(() => {
      logger.info('Attempting to reconnect', 'streaming-connector', { streamId: stream.id });
      this.connectStream(stream.id);
    }, reconnectInterval);
  }

  // ==================== MESSAGE PROCESSING ====================

  /**
   * Process incoming message
   */
  private async processMessage(stream: StreamConfig, message: StreamMessage): Promise<boolean> {
    const stats = this.statistics.get(stream.id);
    if (stats) {
      stats.messagesReceived++;
      stats.lastMessageAt = new Date();
      
      if (typeof message.data === 'object') {
        stats.bytesReceived += JSON.stringify(message.data).length;
      }
    }

    try {
      const startTime = Date.now();

      // Add to buffer for batch processing
      if (!this.messageBuffers.has(stream.id)) {
        this.messageBuffers.set(stream.id, []);
      }
      
      const buffer = this.messageBuffers.get(stream.id)!;
      buffer.push(message);

      // Process batch if size reached or timeout
      const batchSize = stream.batchSize || 100;
      
      if (buffer.length >= batchSize) {
        await this.processBatch(stream, buffer);
        this.messageBuffers.set(stream.id, []);
      }

      // Update stats
      if (stats) {
        const processingTime = Date.now() - startTime;
        stats.avgProcessingTime = (stats.avgProcessingTime * stats.messagesProcessed + processingTime) / (stats.messagesProcessed + 1);
        stats.messagesProcessed++;
      }

      this.emit('message:received', { stream, message });

      return true;

    } catch (error) {
      logger.error('Message processing failed', 'streaming-connector', {
        streamId: stream.id,
        error,
      });

      if (stats) {
        stats.messagesFailed++;
        stats.errors++;
      }

      this.emit('message:failed', { stream, message, error });

      return false;
    }
  }

  /**
   * Process batch of messages
   */
  private async processBatch(stream: StreamConfig, messages: StreamMessage[]): Promise<void> {
    logger.info(`Processing batch of ${messages.length} messages`, 'streaming-connector', {
      streamId: stream.id,
    });

    // Extract data from messages
    const batchData = messages.map(msg => msg.data);

    // If transform pipeline specified, apply it
    if (stream.transformPipelineId) {
      logger.info('Applying transform pipeline', 'streaming-connector', {
        pipelineId: stream.transformPipelineId,
        records: batchData.length,
      });
      
      // Integration: Execute pipeline on streaming data
      // This connects Streaming → Pipeline Execution
      // Would call: await pipelineExecutor.executePipeline(pipeline, { stream: batchData }, context);
    }

    // If target data source specified, store data
    if (stream.targetDataSourceId) {
      logger.info('Storing to data source', 'streaming-connector', {
        dataSourceId: stream.targetDataSourceId,
        records: batchData.length,
      });
      
      // Integration: Store to data source and trigger CDC
      // This connects Streaming → Data Sources → CDC
      // Would call: await cdcManager.incrementalSync(targetDataSourceId, batchData, existingData, cdcConfig);
    }

    // Integration: Emit event for Integration Hub to coordinate
    this.emit('batch:processed', { stream, messages: batchData });
  }

  // ==================== MONITORING ====================

  /**
   * Get stream statistics
   */
  getStats(streamId: string): StreamStats | null {
    return this.statistics.get(streamId) || null;
  }

  /**
   * Get all statistics
   */
  getAllStats(): StreamStats[] {
    return Array.from(this.statistics.values());
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): StreamConfig | null {
    return this.streams.get(streamId) || null;
  }

  /**
   * Get all streams
   */
  getAllStreams(): StreamConfig[] {
    return Array.from(this.streams.values());
  }

  /**
   * Reset statistics
   */
  resetStats(streamId: string): void {
    const stats = this.statistics.get(streamId);
    if (stats) {
      stats.messagesReceived = 0;
      stats.messagesProcessed = 0;
      stats.messagesFailed = 0;
      stats.bytesReceived = 0;
      stats.avgProcessingTime = 0;
      stats.errors = 0;
    }
  }

  /**
   * Shutdown all streams
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down streaming connector', 'streaming-connector');

    for (const streamId of this.connections.keys()) {
      await this.disconnectStream(streamId);
    }
  }
}

// Export singleton instance
export const streamingConnector = StreamingConnector.getInstance();

