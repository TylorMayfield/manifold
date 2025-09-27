import { logger } from "../utils/logger";
import { DatabaseService } from "../../services/DatabaseService";
import { DataSource, Snapshot } from "../../../types";
import {
  ComplexRelationship,
  RelationshipNode,
  RelationshipLink,
  RelationshipSuggestion,
  DataSourceAnalysis,
  ColumnAnalysis,
  ColumnMatch,
  ComplexJoinPlan,
  JoinStep,
  TreeLayout,
  TreeNode,
  TreeEdge,
} from "../../../types/relationships";

export class ComplexRelationshipAnalyzer {
  private static instance: ComplexRelationshipAnalyzer;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): ComplexRelationshipAnalyzer {
    if (!ComplexRelationshipAnalyzer.instance) {
      ComplexRelationshipAnalyzer.instance = new ComplexRelationshipAnalyzer();
    }
    return ComplexRelationshipAnalyzer.instance;
  }

  async analyzeComplexRelationships(
    projectId: string,
    dataSourceIds: string[]
  ): Promise<{
    relationships: RelationshipSuggestion[];
    dataSourceAnalysis: DataSourceAnalysis[];
    joinPlans: ComplexJoinPlan[];
    treeLayout: TreeLayout;
  }> {
    logger.info(
      "Starting complex relationship analysis",
      "system",
      { projectId, dataSourceCount: dataSourceIds.length },
      "ComplexRelationshipAnalyzer"
    );

    try {
      // Get data sources and their snapshots
      const dataSources = await this.dbService.getDataSources(projectId);
      const snapshots = await this.dbService.getSnapshots(projectId);

      const selectedDataSources = dataSources.filter((ds) =>
        dataSourceIds.includes(ds.id)
      );

      // Analyze each data source
      const dataSourceAnalysis = await Promise.all(
        selectedDataSources.map((ds) => this.analyzeDataSource(ds, snapshots))
      );

      // Find relationships between all pairs
      const relationships = this.findRelationships(dataSourceAnalysis);

      // Generate multiple join plans
      const joinPlans = this.generateJoinPlans(
        dataSourceAnalysis,
        relationships
      );

      // Create tree layout for visualization
      const treeLayout = this.createTreeLayout(
        dataSourceAnalysis,
        relationships
      );

      logger.success(
        "Complex relationship analysis completed",
        "system",
        {
          relationshipsFound: relationships.length,
          joinPlansGenerated: joinPlans.length,
          treeNodes: treeLayout.nodes.length,
        },
        "ComplexRelationshipAnalyzer"
      );

      return {
        relationships,
        dataSourceAnalysis,
        joinPlans,
        treeLayout,
      };
    } catch (error) {
      logger.error(
        "Complex relationship analysis failed",
        "system",
        { error, projectId },
        "ComplexRelationshipAnalyzer"
      );
      throw error;
    }
  }

  private async analyzeDataSource(
    dataSource: DataSource,
    snapshots: Snapshot[]
  ): Promise<DataSourceAnalysis> {
    const snapshot = snapshots
      .filter((s) => s.dataSourceId === dataSource.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

    const data = snapshot?.data || [];
    const recordCount = data.length;

    // Analyze columns
    const columns: ColumnAnalysis[] = [];
    if (data.length > 0) {
      const sampleRecord = data[0];

      for (const [columnName, value] of Object.entries(sampleRecord)) {
        const columnData = data.map((record) => record[columnName]);
        const distinctValues = [...new Set(columnData)];
        const uniqueCount = distinctValues.length;

        const columnAnalysis: ColumnAnalysis = {
          name: columnName,
          type: this.inferDataType(value),
          unique: uniqueCount === recordCount,
          nullable: columnData.some((val) => val === null || val === undefined),
          sampleValues: distinctValues.slice(0, 5),
          distinctCount: uniqueCount,
          isIdColumn: this.isIdColumn(columnName, columnData),
          isForeignKey: this.isForeignKey(columnName, columnData, recordCount),
          potentialMatches: [],
        };

        columns.push(columnAnalysis);
      }
    }

    return {
      dataSourceId: dataSource.id,
      dataSourceName: dataSource.name,
      columns,
      relationships: [],
      potentialJoins: [],
      recordCount,
      uniqueValues: {},
    };
  }

  private findRelationships(
    dataSourceAnalysis: DataSourceAnalysis[]
  ): RelationshipSuggestion[] {
    const relationships: RelationshipSuggestion[] = [];

    for (let i = 0; i < dataSourceAnalysis.length; i++) {
      for (let j = i + 1; j < dataSourceAnalysis.length; j++) {
        const source = dataSourceAnalysis[i];
        const target = dataSourceAnalysis[j];

        const columnMatches = this.findColumnMatches(source, target);

        for (const match of columnMatches) {
          if (match.confidence > 0.6) {
            // Minimum confidence threshold
            const relationship = this.createRelationshipSuggestion(
              source,
              target,
              match
            );
            relationships.push(relationship);
          }
        }
      }
    }

    return relationships.sort((a, b) => b.confidence - a.confidence);
  }

  private findColumnMatches(
    source: DataSourceAnalysis,
    target: DataSourceAnalysis
  ): ColumnMatch[] {
    const matches: ColumnMatch[] = [];

    for (const sourceColumn of source.columns) {
      for (const targetColumn of target.columns) {
        const match = this.compareColumns(sourceColumn, targetColumn);
        if (match.confidence > 0.3) {
          // Lower threshold for potential matches
          matches.push(match);
        }
      }
    }

    return matches;
  }

  private compareColumns(
    sourceColumn: ColumnAnalysis,
    targetColumn: ColumnAnalysis
  ): ColumnMatch {
    let confidence = 0;
    let matchType: "exact" | "similar" | "compatible" = "compatible";

    // Type compatibility
    if (sourceColumn.type === targetColumn.type) {
      confidence += 0.3;
      matchType = "exact";
    } else if (this.areTypesCompatible(sourceColumn.type, targetColumn.type)) {
      confidence += 0.2;
      matchType = "compatible";
    }

    // Name similarity
    const nameSimilarity = this.calculateNameSimilarity(
      sourceColumn.name,
      targetColumn.name
    );
    confidence += nameSimilarity * 0.4;

    // ID column detection
    if (sourceColumn.isIdColumn || targetColumn.isIdColumn) {
      confidence += 0.3;
    }

    // Foreign key detection
    if (sourceColumn.isForeignKey || targetColumn.isForeignKey) {
      confidence += 0.2;
    }

    // Value overlap analysis
    const valueOverlap = this.calculateValueOverlap(
      sourceColumn.sampleValues,
      targetColumn.sampleValues
    );
    confidence += valueOverlap * 0.1;

    return {
      sourceColumn: sourceColumn.name,
      targetColumn: targetColumn.name,
      dataType: sourceColumn.type,
      matchType,
      confidence: Math.min(confidence, 1.0),
      sampleValues: {
        source: sourceColumn.sampleValues,
        target: targetColumn.sampleValues,
      },
    };
  }

  private createRelationshipSuggestion(
    source: DataSourceAnalysis,
    target: DataSourceAnalysis,
    match: ColumnMatch
  ): RelationshipSuggestion {
    const relationshipType = this.determineRelationshipType(
      source,
      target,
      match
    );

    const reasoning = this.generateReasoning(
      source,
      target,
      match,
      relationshipType
    );

    return {
      id: `rel_${source.dataSourceId}_${target.dataSourceId}_${match.sourceColumn}_${match.targetColumn}`,
      sourceDataSourceId: source.dataSourceId,
      targetDataSourceId: target.dataSourceId,
      sourceColumn: match.sourceColumn,
      targetColumn: match.targetColumn,
      sourceTableName: source.dataSourceName,
      targetTableName: target.dataSourceName,
      relationshipType,
      confidence: match.confidence,
      reasoning,
      sampleValues: match.sampleValues,
      isActive: match.confidence > 0.8,
    };
  }

  private generateJoinPlans(
    dataSourceAnalysis: DataSourceAnalysis[],
    relationships: RelationshipSuggestion[]
  ): ComplexJoinPlan[] {
    const plans: ComplexJoinPlan[] = [];

    // Generate different join strategies
    const strategies = [
      "left_heavy", // Start with largest table
      "relationship_optimal", // Follow strongest relationships
      "balanced", // Balanced approach
      "minimal_joins", // Fewest joins possible
    ];

    for (const strategy of strategies) {
      const plan = this.createJoinPlan(
        strategy,
        dataSourceAnalysis,
        relationships
      );
      if (plan.isValid) {
        plans.push(plan);
      }
    }

    return plans.sort((a, b) => a.complexity - b.complexity);
  }

  private createJoinPlan(
    strategy: string,
    dataSourceAnalysis: DataSourceAnalysis[],
    relationships: RelationshipSuggestion[]
  ): ComplexJoinPlan {
    const executionOrder: JoinStep[] = [];
    let estimatedRows = 0;
    let complexity = 0;

    // Sort data sources by strategy
    const sortedDataSources = this.sortDataSourcesByStrategy(
      strategy,
      dataSourceAnalysis
    );

    // Build join steps
    let leftDataSourceId: string | undefined;

    for (let i = 0; i < sortedDataSources.length; i++) {
      const rightDataSource = sortedDataSources[i];

      if (i === 0) {
        // First table - no join needed
        leftDataSourceId = rightDataSource.dataSourceId;
        estimatedRows = rightDataSource.recordCount;
      } else {
        // Find best relationship to join with
        const relationship = this.findBestRelationship(
          leftDataSourceId!,
          rightDataSource.dataSourceId,
          relationships
        );

        if (relationship) {
          const joinStep: JoinStep = {
            id: `join_${i}`,
            stepNumber: i,
            leftDataSourceId,
            rightDataSourceId: rightDataSource.dataSourceId,
            relationship: {
              id: relationship.id,
              sourceDataSourceId: relationship.sourceDataSourceId,
              targetDataSourceId: relationship.targetDataSourceId,
              sourceColumn: relationship.sourceColumn,
              targetColumn: relationship.targetColumn,
              relationshipType: relationship.relationshipType,
              joinCondition: `${relationship.sourceTableName}.${relationship.sourceColumn} = ${relationship.targetTableName}.${relationship.targetColumn}`,
              confidence: relationship.confidence,
              isActive: relationship.isActive,
            },
            joinType: "inner", // Default, could be configurable
            estimatedRows: this.estimateJoinRows(
              estimatedRows,
              rightDataSource.recordCount,
              relationship
            ),
            isIntermediate: i < sortedDataSources.length - 1,
            intermediateTableName:
              i < sortedDataSources.length - 1
                ? `intermediate_${i}`
                : undefined,
          };

          executionOrder.push(joinStep);
          estimatedRows = joinStep.estimatedRows;
          complexity += relationship.confidence;
        }
      }
    }

    return {
      id: `plan_${strategy}_${Date.now()}`,
      name: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Join Plan`,
      description: `Join plan using ${strategy} strategy`,
      executionOrder,
      estimatedRows,
      complexity,
      performance: this.determinePerformance(complexity, estimatedRows),
      isValid: executionOrder.length > 0,
      validationErrors:
        executionOrder.length === 0 ? ["No valid relationships found"] : [],
    };
  }

  private createTreeLayout(
    dataSourceAnalysis: DataSourceAnalysis[],
    relationships: RelationshipSuggestion[]
  ): TreeLayout {
    const nodes: TreeNode[] = dataSourceAnalysis.map((ds, index) => ({
      id: ds.dataSourceId,
      dataSourceId: ds.dataSourceId,
      dataSourceName: ds.dataSourceName,
      dataSourceType: "mock", // Could be extracted from actual data source
      recordCount: ds.recordCount,
      position: { x: index * 200, y: 0 },
      level: 0,
      isSelected: false,
      isExpanded: true,
      children: [],
    }));

    const edges: TreeEdge[] = relationships
      .filter((rel) => rel.isActive)
      .map((rel) => ({
        id: rel.id,
        source: rel.sourceDataSourceId,
        target: rel.targetDataSourceId,
        relationship: {
          id: rel.id,
          sourceDataSourceId: rel.sourceDataSourceId,
          targetDataSourceId: rel.targetDataSourceId,
          sourceColumn: rel.sourceColumn,
          targetColumn: rel.targetColumn,
          relationshipType: rel.relationshipType,
          joinCondition: `${rel.sourceTableName}.${rel.sourceColumn} = ${rel.targetTableName}.${rel.targetColumn}`,
          confidence: rel.confidence,
          isActive: rel.isActive,
        },
        isActive: rel.isActive,
        confidence: rel.confidence,
      }));

    // Auto-layout nodes based on relationships
    this.layoutTreeNodes(nodes, edges);

    return {
      nodes,
      edges,
      width: Math.max(...nodes.map((n) => n.position.x)) + 200,
      height: Math.max(...nodes.map((n) => n.position.y)) + 100,
    };
  }

  // Helper methods
  private inferDataType(value: any): string {
    if (value === null || value === undefined) return "unknown";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
      if (/^\d+$/.test(value)) return "integer";
      return "string";
    }
    if (value instanceof Date) return "date";
    return "unknown";
  }

  private isIdColumn(columnName: string, values: any[]): boolean {
    const name = columnName.toLowerCase();
    const isIdName =
      name === "id" || name.endsWith("_id") || name.includes("key");
    const isUnique = new Set(values).size === values.length;
    const isNumeric = values.every(
      (val) => typeof val === "number" || /^\d+$/.test(String(val))
    );

    return isIdName && isUnique && isNumeric;
  }

  private isForeignKey(
    columnName: string,
    values: any[],
    totalCount: number
  ): boolean {
    const name = columnName.toLowerCase();
    const isFkName = name.endsWith("_id") && !name.startsWith("id");
    const uniqueCount = new Set(values).size;
    const isNotUnique = uniqueCount < totalCount * 0.9; // Less than 90% unique

    return isFkName && isNotUnique;
  }

  private areTypesCompatible(type1: string, type2: string): boolean {
    const compatibleTypes = [
      ["string", "text"],
      ["number", "integer"],
      ["integer", "number"],
      ["date", "datetime"],
      ["datetime", "date"],
    ];

    return compatibleTypes.some(
      (pair) =>
        (pair[0] === type1 && pair[1] === type2) ||
        (pair[0] === type2 && pair[1] === type1)
    );
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;
    if (n1.replace(/_/g, "") === n2.replace(/_/g, "")) return 0.7;

    // Simple Levenshtein distance approximation
    const maxLen = Math.max(n1.length, n2.length);
    const minLen = Math.min(n1.length, n2.length);
    return minLen / maxLen;
  }

  private calculateValueOverlap(values1: any[], values2: any[]): number {
    const set1 = new Set(values1.map((v) => String(v)));
    const set2 = new Set(values2.map((v) => String(v)));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private determineRelationshipType(
    source: DataSourceAnalysis,
    target: DataSourceAnalysis,
    match: ColumnMatch
  ): "one_to_one" | "one_to_many" | "many_to_one" | "many_to_many" {
    // This is a simplified determination - in practice, you'd analyze the actual data
    if (match.confidence > 0.9) return "one_to_one";
    if (source.recordCount > target.recordCount * 2) return "many_to_one";
    if (target.recordCount > source.recordCount * 2) return "one_to_many";
    return "many_to_many";
  }

  private generateReasoning(
    source: DataSourceAnalysis,
    target: DataSourceAnalysis,
    match: ColumnMatch,
    relationshipType: string
  ): string {
    const reasons = [];

    if (match.matchType === "exact") reasons.push("exact column name match");
    if (match.matchType === "similar") reasons.push("similar column names");
    if (match.confidence > 0.8) reasons.push("high confidence match");
    if (match.dataType === "integer" && match.sourceColumn.includes("id"))
      reasons.push("ID column detected");

    return reasons.length > 0
      ? reasons.join(", ")
      : "potential relationship based on column analysis";
  }

  private sortDataSourcesByStrategy(
    strategy: string,
    dataSourceAnalysis: DataSourceAnalysis[]
  ): DataSourceAnalysis[] {
    switch (strategy) {
      case "left_heavy":
        return [...dataSourceAnalysis].sort(
          (a, b) => b.recordCount - a.recordCount
        );
      case "relationship_optimal":
        // Sort by number of relationships (would need more complex logic)
        return [...dataSourceAnalysis];
      case "balanced":
        // Mix of size and relationships
        return [...dataSourceAnalysis].sort((a, b) => {
          const scoreA = a.recordCount + (a.relationships?.length || 0) * 1000;
          const scoreB = b.recordCount + (b.relationships?.length || 0) * 1000;
          return scoreB - scoreA;
        });
      case "minimal_joins":
        return [...dataSourceAnalysis];
      default:
        return [...dataSourceAnalysis];
    }
  }

  private findBestRelationship(
    leftDataSourceId: string,
    rightDataSourceId: string,
    relationships: RelationshipSuggestion[]
  ): RelationshipSuggestion | undefined {
    return relationships
      .filter(
        (rel) =>
          (rel.sourceDataSourceId === leftDataSourceId &&
            rel.targetDataSourceId === rightDataSourceId) ||
          (rel.sourceDataSourceId === rightDataSourceId &&
            rel.targetDataSourceId === leftDataSourceId)
      )
      .sort((a, b) => b.confidence - a.confidence)[0];
  }

  private estimateJoinRows(
    leftRows: number,
    rightRows: number,
    relationship: RelationshipSuggestion
  ): number {
    // Simplified estimation - in practice, you'd analyze actual data distribution
    switch (relationship.relationshipType) {
      case "one_to_one":
        return Math.min(leftRows, rightRows);
      case "one_to_many":
        return Math.max(leftRows, rightRows);
      case "many_to_one":
        return Math.max(leftRows, rightRows);
      case "many_to_many":
        return leftRows * rightRows * 0.1; // Assume 10% overlap
      default:
        return Math.max(leftRows, rightRows);
    }
  }

  private determinePerformance(
    complexity: number,
    estimatedRows: number
  ): "fast" | "moderate" | "slow" {
    if (estimatedRows < 10000 && complexity < 2) return "fast";
    if (estimatedRows < 100000 && complexity < 4) return "moderate";
    return "slow";
  }

  private layoutTreeNodes(nodes: TreeNode[], edges: TreeEdge[]): void {
    // Simple grid layout - in practice, you'd use a proper graph layout algorithm
    const levels = new Map<number, TreeNode[]>();

    // Group nodes by level
    nodes.forEach((node) => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    });

    // Position nodes
    levels.forEach((levelNodes, level) => {
      const y = level * 150;
      levelNodes.forEach((node, index) => {
        const x = index * 200;
        node.position = { x, y };
      });
    });
  }
}
